import { AppState } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { fetch } from 'expo/fetch';

export interface Message {
  role: 'user' | 'assistant' | 'error';
  content: string;
  complete: boolean;
  msgId: string;
  seq?: string;
  badge?: string;
}

export interface PermissionItem {
  toolUseID: string;
  toolName: string;
  input: Record<string, unknown>;
}

export interface Session {
  id: string;
  label?: string;
  preview?: string;
  updatedAt?: string;
  createdAt?: string;
}

export interface Repo {
  path: string;
  name: string;
  isGit: boolean;
}

export type DirEntry = {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number | null;
};

export type FileContentResult = {
  path: string;
  content: string;
  size: number;
};

interface ConnectionEntry {
  // Identity
  baseUrl: string;
  currentRepoPath: string | null;
  currentAgent: string | null;
  currentSessionId: string | null;

  // SSE stream state
  sseAbortController: AbortController | null;
  lastEventId: string | null;

  // Reactive state
  streaming: boolean;
  messages: Message[];
  activity: { label: string } | null;
  permissionQueue: PermissionItem[];
  sessionId: string | null;
  sessionsList: Session[];
  repos: Repo[];
  diffs: string | null;
  dirListing: DirEntry[] | null;
  fileContent: FileContentResult | null;
  cloneStatus: { cloning: boolean; creating: boolean; error: string | null };
  serverCwd: string | null;

  // TODO: Revisit connection health indicators
  // connected: boolean;
  // reconnecting: boolean;

  msgCounter: number;
  listeners: Set<() => void>;
}

const _connections = new Map<string, ConnectionEntry>();
const _globalListeners = new Set<() => void>();

function notifyListeners(url: string) {
  const entry = _connections.get(url);
  if (!entry) return;
  entry.listeners.forEach(fn => fn());
  _globalListeners.forEach(fn => fn());
}

function nextMsgId(entry: ConnectionEntry): string {
  return 'm' + (++entry.msgCounter);
}

// --- SSE parser ---
// Parses text/event-stream chunks from a ReadableStream reader.
// Returns complete frames split by double newlines.
function parseSSEChunk(buffer: string): { frames: { id?: string; event?: string; data?: string }[]; remainder: string } {
  const frames: { id?: string; event?: string; data?: string }[] = [];
  const parts = buffer.split('\n\n');
  const remainder = parts.pop() ?? '';

  for (const part of parts) {
    if (!part.trim()) continue;
    const frame: { id?: string; event?: string; data?: string } = {};
    for (const line of part.split('\n')) {
      if (line.startsWith('id:')) {
        frame.id = line.slice(3).trim();
      } else if (line.startsWith('event:')) {
        frame.event = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        frame.data = line.slice(5).trim();
      }
    }
    frames.push(frame);
  }

  return { frames, remainder };
}

// --- SSE event handler ---
function handleSSEEvent(serverUrl: string, event: string | undefined, data: string | undefined) {
  const entry = _connections.get(serverUrl);
  if (!entry) return;

  let parsed: Record<string, unknown> = {};
  if (data) {
    try { parsed = JSON.parse(data); } catch { parsed = { raw: data }; }
  }

  if (event === 'user_prompt') {
    // Server replays buffered events including user_prompt on reconnect.
    // Skip if the message is already in the list (we add it optimistically in sendMessageStore).
    const content = (parsed.content as string) ?? (parsed.prompt as string) ?? '';
    const alreadyPresent = entry.messages.some(m => m.role === 'user' && m.content === content);
    if (!alreadyPresent && content) {
      entry.messages = [...entry.messages, {
        role: 'user',
        content,
        complete: true,
        msgId: nextMsgId(entry),
      }];
      notifyListeners(serverUrl);
    }
    return;
  }

  if (event === 'system') {
    // Record the SDK session ID for display, but don't overwrite currentSessionId
    // (which holds the grass UUID used for abort/permission endpoints).
    const d = parsed.data as Record<string, unknown> | undefined;
    const sessionIdVal = (d?.session_id ?? parsed.session_id) as string | undefined;
    if (sessionIdVal && !entry.sessionId) {
      entry.sessionId = sessionIdVal;
      notifyListeners(serverUrl);
    }
    return;
  }

  if (event === 'status') {
    const status = parsed.status as string;
    if (status === 'thinking') {
      entry.activity = { label: 'Thinking' };
    } else if (status === 'tool') {
      const elapsed = parsed.elapsed != null ? Math.round(parsed.elapsed as number) + 's' : '';
      entry.activity = { label: (parsed.tool_name as string) + (elapsed ? ' (' + elapsed + ')' : '') };
    } else if (status === 'tool_summary') {
      entry.activity = { label: parsed.summary as string };
    } else {
      entry.activity = null;
    }
    notifyListeners(serverUrl);
    return;
  }

  if (event === 'tool_use') {
    entry.activity = { label: (parsed.tool_name as string) + ': ' + (parsed.tool_input as string) };
    notifyListeners(serverUrl);
    return;
  }

  if (event === 'assistant') {
    // Don't clear activity here — let result/done handle it so the activity bar
    // stays visible during streaming even if events are batched.
    const seq = parsed.seq as string | undefined;
    const content = parsed.content as string;
    const prev = entry.messages;
    const last = prev[prev.length - 1];
    if (last && last.role === 'assistant' && !last.complete) {
      entry.messages = [...prev.slice(0, -1), { ...last, content, seq }];
    } else {
      entry.messages = [...prev, { role: 'assistant', content, complete: false, msgId: nextMsgId(entry), seq }];
    }
    notifyListeners(serverUrl);
    return;
  }

  if (event === 'result') {
    entry.streaming = false;
    entry.activity = null;
    const cost = parsed.cost != null ? '$' + (parsed.cost as number).toFixed(4) : null;
    const duration = parsed.duration_ms != null ? ((parsed.duration_ms as number) / 1000).toFixed(1) + 's' : null;
    const badge = [cost, duration].filter(Boolean).join(' · ');
    const lastIdx = entry.messages.length - 1;
    entry.messages = entry.messages.map((msg, i) =>
      msg.role === 'assistant' && !msg.complete
        ? { ...msg, complete: true, ...(i === lastIdx ? { badge } : {}) }
        : msg
    );
    notifyListeners(serverUrl);
    return;
  }

  if (event === 'permission_request') {
    if (!entry.permissionQueue.some(p => p.toolUseID === parsed.toolUseID)) {
      entry.permissionQueue = [...entry.permissionQueue, {
        toolUseID: parsed.toolUseID as string,
        toolName: parsed.toolName as string,
        input: (parsed.input as Record<string, unknown>) || {},
      }];
      notifyListeners(serverUrl);
    }
    return;
  }

  if (event === 'done') {
    entry.streaming = false;
    entry.activity = null;
    entry.messages = entry.messages.map(msg =>
      msg.role === 'assistant' && !msg.complete ? { ...msg, complete: true } : msg
    );
    notifyListeners(serverUrl);
    return;
  }

  if (event === 'error') {
    entry.streaming = false;
    entry.activity = null;
    if (entry.cloneStatus.cloning || entry.cloneStatus.creating) {
      entry.cloneStatus = { ...entry.cloneStatus, cloning: false, creating: false, error: parsed.message as string };
    } else {
      entry.messages = [...entry.messages, { role: 'error', content: parsed.message as string, complete: true, msgId: nextMsgId(entry) }];
    }
    notifyListeners(serverUrl);
    return;
  }

  if (event === 'aborted') {
    entry.streaming = false;
    entry.activity = null;
    entry.messages = [...entry.messages, { role: 'error', content: '⚠️ ' + (parsed.message as string ?? 'Aborted'), complete: true, msgId: nextMsgId(entry) }];
    notifyListeners(serverUrl);
    return;
  }
}

// --- SSE stream ---
async function openSSEStream(serverUrl: string, sessionId: string) {
  const entry = _connections.get(serverUrl);
  if (!entry) return;

  // Close any existing stream
  closeSSEStream(serverUrl);

  const controller = new AbortController();
  entry.sseAbortController = controller;
  entry.streaming = true;
  notifyListeners(serverUrl);

  const headers: Record<string, string> = { Accept: 'text/event-stream' };
  if (entry.lastEventId) headers['Last-Event-ID'] = entry.lastEventId;

  let buffer = '';

  try {
    const response = await fetch(
      `${serverUrl}/events?sessionId=${encodeURIComponent(sessionId)}`,
      { headers, signal: controller.signal, reactNativeFetchMode: 'stream' } as unknown as Parameters<typeof fetch>[1]
    );

    if (!response.body) return;
    const reader = (response.body as ReadableStream<Uint8Array>).getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const { frames, remainder } = parseSSEChunk(buffer);
      buffer = remainder;

      for (const frame of frames) {
        if (frame.id) {
          entry.lastEventId = frame.id;
        }
        handleSSEEvent(serverUrl, frame.event, frame.data);
      }
    }
  } catch {
    // aborted or network error — streaming stops, no auto-reconnect
  }

  const e = _connections.get(serverUrl);
  if (e) {
    e.sseAbortController = null;
    e.streaming = false;
    notifyListeners(serverUrl);
  }
}

export function closeSSEStream(serverUrl: string) {
  const entry = _connections.get(serverUrl);
  if (!entry) return;
  if (entry.sseAbortController) {
    entry.sseAbortController.abort();
    entry.sseAbortController = null;
  }
  entry.streaming = false;
}

// AppState handling — runs once on import
let _appStateValue = AppState.currentState;
AppState.addEventListener('change', (next) => {
  if (_appStateValue === next) return;
  _appStateValue = next;
  if (next !== 'active') {
    // Background: close all SSE streams
    for (const [url] of _connections) closeSSEStream(url);
    _globalListeners.forEach(fn => fn());
  } else {
    // Foreground: re-attach SSE if a session was streaming
    for (const [url, entry] of _connections) {
      if (entry.currentSessionId && entry.streaming) {
        openSSEStream(url, entry.currentSessionId);
      }
    }
    _globalListeners.forEach(fn => fn());
  }
});

// --- Connection lifecycle ---

export function openConnection(serverUrl: string) {
  if (_connections.has(serverUrl)) return;
  const entry: ConnectionEntry = {
    baseUrl: serverUrl,
    currentRepoPath: null,
    currentAgent: null,
    currentSessionId: null,
    sseAbortController: null,
    lastEventId: null,
    streaming: false,
    messages: [],
    activity: null,
    permissionQueue: [],
    sessionId: null,
    sessionsList: [],
    repos: [],
    diffs: null,
    dirListing: null,
    fileContent: null,
    cloneStatus: { cloning: false, creating: false, error: null },
    serverCwd: null,
    msgCounter: 0,
    listeners: new Set(),
  };
  _connections.set(serverUrl, entry);
  healthStore(serverUrl);
  listReposStore(serverUrl);
  _globalListeners.forEach(fn => fn());
}

export function closeConnection(serverUrl: string) {
  closeSSEStream(serverUrl);
  _connections.delete(serverUrl);
  _globalListeners.forEach(fn => fn());
}

export function subscribeToConnection(url: string, fn: () => void): () => void {
  const entry = _connections.get(url);
  if (!entry) return () => {};
  entry.listeners.add(fn);
  return () => entry.listeners.delete(fn);
}

export function subscribeToAll(fn: () => void): () => void {
  _globalListeners.add(fn);
  return () => _globalListeners.delete(fn);
}

export function getEntry(url: string): ConnectionEntry | undefined {
  return _connections.get(url);
}

// --- Chat ---

export async function sendMessageStore(serverUrl: string, text: string) {
  const entry = _connections.get(serverUrl);
  if (!entry || !text.trim()) return;

  entry.messages = [...entry.messages, { role: 'user', content: text, complete: true, msgId: nextMsgId(entry) }];
  entry.streaming = true;
  entry.activity = { label: 'Thinking' };
  notifyListeners(serverUrl);

  try {
    const res = await fetch(`${serverUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        repoPath: entry.currentRepoPath,
        agent: entry.currentAgent,
        prompt: text,
        ...(entry.currentSessionId ? { sessionId: entry.currentSessionId } : {}),
      }),
    });
    const json = await res.json() as { sessionId?: string };
    const sid = json.sessionId ?? entry.currentSessionId;
    if (sid) {
      entry.currentSessionId = sid;
      entry.sessionId = sid;
      entry.lastEventId = null;
      notifyListeners(serverUrl);
      openSSEStream(serverUrl, sid);
    }
  } catch {
    entry.streaming = false;
    entry.activity = null;
    entry.messages = [...entry.messages, { role: 'error', content: 'Failed to send message', complete: true, msgId: nextMsgId(entry) }];
    notifyListeners(serverUrl);
  }
}

// Keep legacy name as alias
export const sendMessage = sendMessageStore;

export async function abortStore(serverUrl: string) {
  const entry = _connections.get(serverUrl);
  if (!entry || !entry.currentSessionId) return;
  entry.permissionQueue = [];
  notifyListeners(serverUrl);
  try {
    await fetch(`${serverUrl}/sessions/${entry.currentSessionId}/abort`, { method: 'POST' });
  } catch { /* ignore */ }
}

// Keep legacy name as alias
export const abortConnection = abortStore;

export async function respondPermissionStore(serverUrl: string, approved: boolean) {
  const entry = _connections.get(serverUrl);
  if (!entry || entry.permissionQueue.length === 0 || !entry.currentSessionId) return;
  const current = entry.permissionQueue[0];
  entry.permissionQueue = entry.permissionQueue.slice(1);
  notifyListeners(serverUrl);
  try {
    await fetch(`${serverUrl}/sessions/${entry.currentSessionId}/permission`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolUseID: current.toolUseID, approved }),
    });
  } catch { /* ignore */ }
}

// --- Health ---

export async function healthStore(serverUrl: string) {
  const entry = _connections.get(serverUrl);
  if (!entry) return;
  try {
    const res = await fetch(`${serverUrl}/health`);
    const json = await res.json() as { cwd?: string };
    if (_connections.has(serverUrl) && json.cwd) {
      entry.serverCwd = json.cwd;
      notifyListeners(serverUrl);
    }
  } catch { /* ignore */ }
}

// --- Repos ---

export async function listReposStore(serverUrl: string) {
  const entry = _connections.get(serverUrl);
  if (!entry) return;
  try {
    const res = await fetch(`${serverUrl}/repos`);
    const json = await res.json() as { repos?: Repo[] };
    if (_connections.has(serverUrl)) {
      entry.repos = json.repos ?? [];
      notifyListeners(serverUrl);
    }
  } catch { /* ignore */ }
}

export async function cloneRepoStore(serverUrl: string, gitUrl: string): Promise<void> {
  const entry = _connections.get(serverUrl);
  if (!entry) return;
  entry.cloneStatus = { cloning: true, creating: false, error: null };
  notifyListeners(serverUrl);
  try {
    const res = await fetch(`${serverUrl}/repos/clone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: gitUrl }),
    });
    const json = await res.json() as { path?: string; name?: string; error?: string };
    if (!_connections.has(serverUrl)) return;
    if (json.error) {
      entry.cloneStatus = { cloning: false, creating: false, error: json.error };
    } else {
      const repo: Repo = { path: json.path!, name: json.name!, isGit: true };
      entry.repos = [...entry.repos, repo];
      entry.cloneStatus = { cloning: false, creating: false, error: null };
    }
    notifyListeners(serverUrl);
  } catch (err) {
    if (_connections.has(serverUrl)) {
      entry.cloneStatus = { cloning: false, creating: false, error: String(err) };
      notifyListeners(serverUrl);
    }
  }
}

export async function createFolderStore(serverUrl: string, name: string): Promise<void> {
  const entry = _connections.get(serverUrl);
  if (!entry) return;
  entry.cloneStatus = { cloning: false, creating: true, error: null };
  notifyListeners(serverUrl);
  try {
    const res = await fetch(`${serverUrl}/folders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const json = await res.json() as { path?: string; name?: string; error?: string };
    if (!_connections.has(serverUrl)) return;
    if (json.error) {
      entry.cloneStatus = { cloning: false, creating: false, error: json.error };
    } else {
      const repo: Repo = { path: json.path!, name: json.name!, isGit: false };
      entry.repos = [...entry.repos, repo];
      entry.cloneStatus = { cloning: false, creating: false, error: null };
    }
    notifyListeners(serverUrl);
  } catch (err) {
    if (_connections.has(serverUrl)) {
      entry.cloneStatus = { cloning: false, creating: false, error: String(err) };
      notifyListeners(serverUrl);
    }
  }
}

export function clearCloneStatusStore(serverUrl: string) {
  const entry = _connections.get(serverUrl);
  if (!entry) return;
  entry.cloneStatus = { cloning: false, creating: false, error: null };
  notifyListeners(serverUrl);
}

export function resetFileViewStore(serverUrl: string) {
  const entry = _connections.get(serverUrl);
  if (!entry) return;
  entry.fileContent = null;
  entry.dirListing = null;
  notifyListeners(serverUrl);
}

// --- Sessions ---

export async function listSessionsStore(serverUrl: string, repoPath?: string, agent?: string) {
  const entry = _connections.get(serverUrl);
  if (!entry) return;
  try {
    const params = new URLSearchParams();
    if (repoPath) params.set('repoPath', repoPath);
    if (agent) params.set('agent', agent);
    const qs = params.toString();
    const res = await fetch(`${serverUrl}/sessions${qs ? '?' + qs : ''}`);
    const json = await res.json() as { sessions?: Session[] };
    if (_connections.has(serverUrl)) {
      entry.sessionsList = json.sessions ?? [];
      notifyListeners(serverUrl);
    }
  } catch { /* ignore */ }
}

export async function initSessionStore(serverUrl: string, id: string | null, agent?: string | null, repoPath?: string | null) {
  const entry = _connections.get(serverUrl);
  if (!entry) return;
  entry.currentSessionId = id;
  entry.sessionId = id;
  if (agent !== undefined) entry.currentAgent = agent ?? null;
  if (repoPath !== undefined) entry.currentRepoPath = repoPath ?? null;
  entry.messages = [];
  entry.activity = null;
  notifyListeners(serverUrl);

  if (id) {
    try {
      const params = new URLSearchParams();
      if (agent) params.set('agent', agent);
      if (repoPath) params.set('repoPath', repoPath);
      const qs = params.toString();
      const res = await fetch(`${serverUrl}/sessions/${id}/history${qs ? '?' + qs : ''}`);
      const json = await res.json() as { messages?: Array<{ role: string; content: string }> };
      if (_connections.has(serverUrl)) {
        const msgs = json.messages ?? [];
        entry.messages = msgs.map(m => ({
          role: m.role as Message['role'],
          content: m.content,
          complete: true,
          msgId: nextMsgId(entry),
        }));
        notifyListeners(serverUrl);
      }
    } catch { /* ignore */ }
  }
}

// --- File ops ---

const _dirAbortControllers = new Map<string, AbortController>();
const _fileAbortControllers = new Map<string, AbortController>();

export async function listDirStore(serverUrl: string, path: string, repoPath: string) {
  const entry = _connections.get(serverUrl);
  if (!entry) return;

  // Cancel previous inflight request
  const prevCtrl = _dirAbortControllers.get(serverUrl);
  if (prevCtrl) prevCtrl.abort();
  const ctrl = new AbortController();
  _dirAbortControllers.set(serverUrl, ctrl);

  entry.dirListing = null;
  notifyListeners(serverUrl);

  try {
    const params = new URLSearchParams({ repoPath, path });
    const res = await fetch(`${serverUrl}/dir?${params.toString()}`, { signal: ctrl.signal });
    const json = await res.json() as { entries?: DirEntry[] };
    if (_connections.has(serverUrl)) {
      entry.dirListing = json.entries ?? [];
      notifyListeners(serverUrl);
    }
  } catch { /* aborted or error */ }
}

export async function readFileStore(serverUrl: string, path: string, repoPath: string) {
  const entry = _connections.get(serverUrl);
  if (!entry) return;

  // Cancel previous inflight request
  const prevCtrl = _fileAbortControllers.get(serverUrl);
  if (prevCtrl) prevCtrl.abort();
  const ctrl = new AbortController();
  _fileAbortControllers.set(serverUrl, ctrl);

  try {
    const params = new URLSearchParams({ repoPath, path });
    const res = await fetch(`${serverUrl}/file?${params.toString()}`, { signal: ctrl.signal });
    const json = await res.json() as { content: string; size: number };
    if (_connections.has(serverUrl)) {
      entry.fileContent = { path, content: json.content, size: json.size };
      notifyListeners(serverUrl);
    }
  } catch { /* aborted or error */ }
}

export async function getDiffsStore(serverUrl: string, repoPath?: string) {
  const entry = _connections.get(serverUrl);
  if (!entry) return;
  try {
    const params = new URLSearchParams();
    if (repoPath) params.set('repoPath', repoPath);
    const qs = params.toString();
    const res = await fetch(`${serverUrl}/diffs${qs ? '?' + qs : ''}`);
    const json = await res.json() as { diff?: string };
    if (_connections.has(serverUrl)) {
      entry.diffs = json.diff ?? null;
      notifyListeners(serverUrl);
    }
  } catch { /* ignore */ }
}

// TODO: Revisit connection health indicators
// export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';
// export function useConnectionStatuses(): Map<string, ConnectionStatus> { ... }
// export function reconnectNow(url: string) { ... }

// TODO: Revisit connection health indicators
// export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';
// export function useConnectionStatuses(): Map<string, ConnectionStatus> { ... }
export function useConnectionStatuses(): Map<string, never> {
  return new Map<string, never>();
}

export function useServerCount(): number {
  const [, forceUpdate] = useState(0);
  const unsubRef = useRef<(() => void) | null>(null);
  if (!unsubRef.current) {
    unsubRef.current = subscribeToAll(() => forceUpdate(n => n + 1));
  }
  useEffect(() => {
    return () => { unsubRef.current?.(); unsubRef.current = null; };
  }, []);
  return _connections.size;
}
