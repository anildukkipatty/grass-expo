import { AppState } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { fetch } from 'expo/fetch';
import { resolveServerKey, resolveServerUrl } from './url-store';
import { APP_VERSION } from '@/constants/versions';
import { checkVersionCompat, CompatResult } from '@/store/version-compat';

export interface Message {
  role: 'user' | 'assistant' | 'error' | 'tool';
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

export interface GlobalPermissionItem {
  sessionId: string;
  sdkSessionId: string | null;
  agent: 'claude-code' | 'opencode' | string;
  repoPath: string;
  repoName: string;
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

export interface RepoDetails {
  branch: string | null;
  lastCommit: { message: string; hash: string; timestamp: number } | null;
  dominantLanguage: string | null;
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

export type PermissionMode = 'ask-permissions' | 'allow-all-edits' | 'yolo';

interface ConnectionEntry {
  // Identity
  baseUrl: string;
  currentRepoPath: string | null;
  currentAgent: string | null;
  currentSessionId: string | null;

  // SSE stream state
  sseAbortController: AbortController | null;
  // In-flight POST /chat request (before sessionId/SSE is attached)
  sendAbortController: AbortController | null;
  lastEventId: string | null;

  // Reactive state
  streaming: boolean;
  messages: Message[];
  activity: { label: string } | null;
  permissionQueue: PermissionItem[];
  sessionId: string | null;
  sdkSessionId: string | null;
  sessionsList: Session[];
  repos: Repo[];
  repoDetails: Map<string, RepoDetails>;
  diffs: string | null;
  dirListing: DirEntry[] | null;
  fileContent: FileContentResult | null;
  sessionLoading: boolean;
  cloneStatus: { cloning: boolean; creating: boolean; error: string | null };
  serverCwd: string | null;
  serverVersion: string | null;
  clientVersionRange: string | null;
  versionCompatible: boolean | null;  // null = not yet checked
  permissionMode: PermissionMode;

  // TODO: Revisit connection health indicators
  // connected: boolean;
  // reconnecting: boolean;

  msgCounter: number;
  listeners: Set<() => void>;
}

const _connections = new Map<string, ConnectionEntry>();
const _globalListeners = new Set<() => void>();

// --- Global permissions SSE (one per server URL) ---

export interface SessionStatusItem {
  grassId: string;
  sessionId: string | null;
  status: 'running' | 'awaiting_permissions' | 'done' | 'error';
}

interface PermissionsSSEEntry {
  abortController: AbortController | null;
  permissions: GlobalPermissionItem[];
  sessions: SessionStatusItem[];
  listeners: Set<() => void>;
  resolvedUrl: string | null;
}

const _permissionsSSE = new Map<string, PermissionsSSEEntry>();

// grassId → whether the done dot should be shown.
// Defaults to true (show) for any unseen thread.
// Set to false when user opens a thread that is currently 'done'.
// Reset to true when a thread transitions to 'running' or 'awaiting_permissions'.
const _showDoneIndicator = new Map<string, boolean>();

// SDK session id → live GRASS UUID, per server.
// Persisted thread records key by SDK id (durable across server restarts), but the
// permissions stream keys live sessions by the ephemeral GRASS UUID. This map bridges
// the two so the home screen can look up status for a thread by its SDK id.
// Key: `${serverKey}:${sdkId}` → grassId
const _sdkToGrass = new Map<string, string>();

function bridgeKey(serverKey: string, sdkId: string) {
  return `${serverKey}:${sdkId}`;
}

function rememberBinding(serverKey: string, grassId: string, sdkId: string | null | undefined) {
  if (!sdkId) return;
  _sdkToGrass.set(bridgeKey(serverKey, sdkId), grassId);
}

export function resolveGrassIdForSdk(serverUrl: string, sdkId: string): string | null {
  const key = resolveServerKey(serverUrl);
  return _sdkToGrass.get(bridgeKey(key, sdkId)) ?? null;
}

export function markThreadSeen(serverUrl: string, grassId: string) {
  _showDoneIndicator.set(grassId, false);
  notifyPermissionsListeners(resolveServerKey(serverUrl));
}

export function shouldShowDoneIndicator(grassId: string): boolean {
  // If never explicitly hidden, default to showing
  return _showDoneIndicator.get(grassId) !== false;
}

function notifyPermissionsListeners(serverUrl: string) {
  const e = _permissionsSSE.get(serverUrl);
  if (!e) return;
  e.listeners.forEach(fn => fn());
}

async function openPermissionsSSE(serverUrl: string) {
  const key = resolveServerKey(serverUrl);
  const realUrl = _connections.get(key)?.baseUrl ?? resolveServerUrl(serverUrl);
  let entry = _permissionsSSE.get(key);
  if (!entry) {
    entry = { abortController: null, permissions: [], sessions: [], listeners: new Set(), resolvedUrl: null };
    _permissionsSSE.set(key, entry);
  }

  if (entry.abortController) return;

  entry.resolvedUrl = realUrl;
  const controller = new AbortController();
  entry.abortController = controller;

  let buffer = '';

  try {
    const response = await fetch(
      `${realUrl}/permissions/events`,
      { headers: { Accept: 'text/event-stream' }, signal: controller.signal, reactNativeFetchMode: 'stream' } as unknown as Parameters<typeof fetch>[1]
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
        if (frame.event === 'permissions' && frame.data) {
          try {
            const parsed = JSON.parse(frame.data) as { permissions: GlobalPermissionItem[]; sessions?: SessionStatusItem[] };
            const e2 = _permissionsSSE.get(key);
            if (e2) {
              const prevSessions = e2.sessions;
              const nextSessions = parsed.sessions ?? [];
              // Reset done indicator for any thread that transitions to an active state
              const prevMap = new Map(prevSessions.map(s => [s.grassId, s.status]));
              for (const next of nextSessions) {
                if (next.sessionId) {
                  rememberBinding(key, next.grassId, next.sessionId);
                }
                if (next.status === 'running' || next.status === 'awaiting_permissions') {
                  const prev = prevMap.get(next.grassId);
                  if (prev !== next.status) {
                    _showDoneIndicator.set(next.grassId, true);
                  }
                }
              }
              e2.permissions = parsed.permissions ?? [];
              e2.sessions = nextSessions;
              notifyPermissionsListeners(key);
            }
          } catch { /* ignore parse error */ }
        }
      }
    }
  } catch {
    // aborted or network error
  }

  const e2 = _permissionsSSE.get(key);
  if (e2) {
    e2.abortController = null;
  }
}

export function closePermissionsSSE(serverUrl: string) {
  const key = resolveServerKey(serverUrl);
  const entry = _permissionsSSE.get(key);
  if (!entry) return;
  entry.abortController?.abort();
  entry.abortController = null;
}

export function subscribeToPermissions(serverUrl: string, fn: () => void): () => void {
  const key = resolveServerKey(serverUrl);
  let entry = _permissionsSSE.get(key);
  if (!entry) {
    entry = { abortController: null, permissions: [], sessions: [], listeners: new Set(), resolvedUrl: null };
    _permissionsSSE.set(key, entry);
  }
  entry.listeners.add(fn);
  openPermissionsSSE(serverUrl);
  return () => {
    const e = _permissionsSSE.get(key);
    if (e) e.listeners.delete(fn);
  };
}

export function getPermissions(serverUrl: string): GlobalPermissionItem[] {
  const key = resolveServerKey(serverUrl);
  return _permissionsSSE.get(key)?.permissions ?? [];
}

export function getSessionStatuses(serverUrl: string): SessionStatusItem[] {
  const key = resolveServerKey(serverUrl);
  return _permissionsSSE.get(key)?.sessions ?? [];
}

export async function respondGlobalPermission(
  serverUrl: string,
  sessionId: string,
  toolUseID: string,
  approved: boolean,
  updatedInput?: Record<string, unknown>,
) {
  const key = resolveServerKey(serverUrl);
  const entry = _permissionsSSE.get(key);
  const realUrl = entry?.resolvedUrl ?? _connections.get(key)?.baseUrl ?? resolveServerUrl(serverUrl);
  if (entry) {
    entry.permissions = entry.permissions.filter(p => p.toolUseID !== toolUseID);
    notifyPermissionsListeners(key);
  }
  try {
    await fetch(`${realUrl}/sessions/${sessionId}/permission`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedInput !== undefined ? { toolUseID, approved, updatedInput } : { toolUseID, approved }),
    });
  } catch (err) {
    console.warn('[respondGlobalPermission] failed to send response:', { sessionId, toolUseID, approved, err });
  }
}

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
    const d = parsed.data as Record<string, unknown> | undefined;
    const sessionIdVal = (d?.session_id ?? parsed.session_id) as string | undefined;
    if (sessionIdVal && !entry.sdkSessionId) {
      entry.sdkSessionId = sessionIdVal;
      if (entry.currentSessionId) {
        rememberBinding(serverUrl, entry.currentSessionId, sessionIdVal);
      }
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
    const toolLabel = (parsed.tool_name as string) + ': ' + (parsed.tool_input as string);
    entry.activity = { label: toolLabel };
    entry.messages = [...entry.messages, { role: 'tool', content: toolLabel, complete: true, msgId: nextMsgId(entry) }];
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
      // Guard against SSE replay arriving after history loaded the same message as complete.
      // This can happen when buffered SSE chunks are processed after closeSSEStream is called.
      const alreadyComplete = prev.some(m => m.role === 'assistant' && m.complete && m.content === content);
      if (!alreadyComplete) {
        entry.messages = [...prev, { role: 'assistant', content, complete: false, msgId: nextMsgId(entry), seq }];
      }
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
    // Permissions are now handled exclusively by the global /permissions/events SSE.
    // Ignore permission_request events from the per-session stream.
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
async function openSSEStream(serverKey: string, sessionId: string) {
  const entry = _connections.get(serverKey);
  if (!entry) return;

  closeSSEStream(serverKey);

  const controller = new AbortController();
  entry.sseAbortController = controller;
  entry.streaming = true;
  notifyListeners(serverKey);

  const headers: Record<string, string> = { Accept: 'text/event-stream' };
  if (entry.lastEventId) headers['Last-Event-ID'] = entry.lastEventId;

  let buffer = '';

  try {
    const response = await fetch(
      `${entry.baseUrl}/events?sessionId=${encodeURIComponent(sessionId)}`,
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
        handleSSEEvent(serverKey, frame.event, frame.data);
      }
    }
  } catch {
    // aborted or network error
  }

  const e = _connections.get(serverKey);
  if (e) {
    e.sseAbortController = null;
    e.streaming = false;
    notifyListeners(serverKey);
  }
}

export function closeSSEStream(serverUrl: string) {
  const key = resolveServerKey(serverUrl);
  const entry = _connections.get(key);
  if (!entry) return;
  if (entry.sseAbortController) {
    entry.sseAbortController.abort();
    entry.sseAbortController = null;
    entry.streaming = false;
  }
}

// AppState handling — runs once on import
//
// Tracks which connections were actively streaming at the moment the app was
// backgrounded. closeSSEStream() clears entry.streaming as a side-effect, so
// we capture this before closing — otherwise the foreground handler would
// always see streaming=false and never reconnect.
//
// iOS fires: active → inactive → background (going away)
//            background → inactive → active  (coming back)
// Both 'inactive' and 'background' hit the next !== 'active' branch, so we
// must only snapshot on the single transition away from 'active' (prev === 'active').
// Subsequent inactive→background fires must not clear the map.
const _wasStreamingOnBackground = new Map<string, string>(); // serverKey → sessionId

let _appStateValue = AppState.currentState;
AppState.addEventListener('change', (next) => {
  if (_appStateValue === next) return;
  const prev = _appStateValue;
  _appStateValue = next;
  if (next !== 'active') {
    // Snapshot streaming sessions only on the first step away from active.
    // Later inactive→background (and background→inactive on return) must not
    // overwrite the map, because entry.streaming is already false by then.
    if (prev === 'active') {
      _wasStreamingOnBackground.clear();
      for (const [url, entry] of _connections) {
        if (entry.streaming && entry.currentSessionId) {
          _wasStreamingOnBackground.set(url, entry.currentSessionId);
        }
      }
    }
    for (const [url] of _connections) closeSSEStream(url);
    for (const [url] of _permissionsSSE) closePermissionsSSE(url);
    _globalListeners.forEach(fn => fn());
  } else {
    // Foreground: re-attach SSE for any session that was streaming when we left.
    // The server replays missed events via Last-Event-ID, so result/done events
    // will naturally reset streaming=false if the agent finished while backgrounded.
    for (const [url, sessionId] of _wasStreamingOnBackground) {
      openSSEStream(url, sessionId);
    }
    _wasStreamingOnBackground.clear();
    // Re-open permissions SSE for any server that had listeners
    for (const [url, pEntry] of _permissionsSSE) {
      if (pEntry.listeners.size > 0) openPermissionsSSE(url);
    }
    _globalListeners.forEach(fn => fn());
  }
});

// --- Connection lifecycle ---

/**
 * Signed preview URLs rotate; the stable map key (e.g. `grassvm`) must keep using the latest base URL.
 * Updates `baseUrl`, reconnects live SSE channels to the new host, and refreshes health/repos when the URL changes.
 */
function syncConnectionBaseUrlIfChanged(key: string, realUrl: string): void {
  const existing = _connections.get(key);
  if (!existing || existing.baseUrl === realUrl) return;

  const activeChatSse =
    !!existing.sseAbortController && existing.currentSessionId != null;
  const reconnectSessionId = activeChatSse ? existing.currentSessionId : null;

  existing.baseUrl = realUrl;

  closeSSEStream(key);
  if (reconnectSessionId) {
    void openSSEStream(key, reconnectSessionId);
  }

  closePermissionsSSE(key);
  const perm = _permissionsSSE.get(key);
  if (perm && perm.listeners.size > 0) {
    void openPermissionsSSE(key);
  }

  void healthStore(key).catch(() => {});
  void listReposStore(key);

  notifyListeners(key);
  _globalListeners.forEach((fn) => fn());
}

export function openConnection(serverUrl: string) {
  const key = resolveServerKey(serverUrl);
  const realUrl = resolveServerUrl(serverUrl);
  if (_connections.has(key)) {
    syncConnectionBaseUrlIfChanged(key, realUrl);
    return;
  }
  const entry: ConnectionEntry = {
    baseUrl: realUrl,
    currentRepoPath: null,
    currentAgent: null,
    currentSessionId: null,
    sseAbortController: null,
    sendAbortController: null,
    lastEventId: null,
    streaming: false,
    messages: [],
    activity: null,
    permissionQueue: [],
    sessionId: null,
    sdkSessionId: null,
    sessionsList: [],
    repos: [],
    repoDetails: new Map(),
    diffs: null,
    dirListing: null,
    fileContent: null,
    sessionLoading: false,
    cloneStatus: { cloning: false, creating: false, error: null },
    serverCwd: null,
    serverVersion: null,
    clientVersionRange: null,
    versionCompatible: null,
    permissionMode: 'ask-permissions',
    msgCounter: 0,
    listeners: new Set(),
  };
  _connections.set(key, entry);
  void healthStore(key).catch(() => {});
  listReposStore(key);
  _globalListeners.forEach(fn => fn());
}

export function openConnectionWithKey(key: string, realUrl: string) {
  if (_connections.has(key)) {
    syncConnectionBaseUrlIfChanged(key, realUrl);
    return;
  }
  const entry: ConnectionEntry = {
    baseUrl: realUrl,
    currentRepoPath: null,
    currentAgent: null,
    currentSessionId: null,
    sseAbortController: null,
    sendAbortController: null,
    lastEventId: null,
    streaming: false,
    messages: [],
    activity: null,
    permissionQueue: [],
    sessionId: null,
    sdkSessionId: null,
    sessionsList: [],
    repos: [],
    repoDetails: new Map(),
    diffs: null,
    dirListing: null,
    fileContent: null,
    sessionLoading: false,
    cloneStatus: { cloning: false, creating: false, error: null },
    serverCwd: null,
    serverVersion: null,
    clientVersionRange: null,
    versionCompatible: null,
    permissionMode: 'ask-permissions',
    msgCounter: 0,
    listeners: new Set(),
  };
  _connections.set(key, entry);
  void healthStore(key).catch(() => {});
  listReposStore(key);
  _globalListeners.forEach(fn => fn());
}

export function closeConnection(serverUrl: string) {
  const key = resolveServerKey(serverUrl);
  const entry = _connections.get(key);
  if (entry?.sendAbortController) {
    entry.sendAbortController.abort();
    entry.sendAbortController = null;
  }
  closeSSEStream(key);
  closePermissionsSSE(key);
  _permissionsSSE.delete(key);
  _connections.delete(key);
  _globalListeners.forEach(fn => fn());
}

export function subscribeToConnection(url: string, fn: () => void): () => void {
  const key = resolveServerKey(url);
  const entry = _connections.get(key);
  if (!entry) return () => {};
  entry.listeners.add(fn);
  return () => entry.listeners.delete(fn);
}

export function subscribeToAll(fn: () => void): () => void {
  _globalListeners.add(fn);
  return () => _globalListeners.delete(fn);
}

export function getEntry(url: string): ConnectionEntry | undefined {
  const key = resolveServerKey(url);
  return _connections.get(key);
}

export function getConnectedUrls(): string[] {
  return Array.from(_connections.keys());
}

// --- Chat ---

export async function sendMessageStore(serverUrl: string, text: string, model?: string, mode?: 'plan' | 'build', permissionMode?: PermissionMode) {
  const key = resolveServerKey(serverUrl);
  const entry = _connections.get(key);
  if (!entry || !text.trim()) return;

  // Cancel any previous in-flight send before starting a new one.
  if (entry.sendAbortController) {
    entry.sendAbortController.abort();
    entry.sendAbortController = null;
  }
  const sendCtrl = new AbortController();
  entry.sendAbortController = sendCtrl;

  entry.messages = [...entry.messages, { role: 'user', content: text, complete: true, msgId: nextMsgId(entry) }];
  entry.streaming = true;
  entry.activity = { label: 'Thinking' };
  notifyListeners(key);

  try {
    const res = await fetch(`${entry.baseUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: sendCtrl.signal,
      body: JSON.stringify({
        repoPath: entry.currentRepoPath,
        agent: entry.currentAgent,
        prompt: text,
        ...(entry.currentSessionId ? { sessionId: entry.currentSessionId } : {}),
        ...(model ? { model } : {}),
        ...(mode ? { mode } : {}),
        ...(permissionMode ? { permissionMode } : {}),
      }),
    });

    // Ignore stale completions if a newer send replaced this controller.
    const latest = _connections.get(key);
    if (!latest || latest.sendAbortController !== sendCtrl) return;
    latest.sendAbortController = null;

    const json = await res.json() as { sessionId?: string };
    const sid = json.sessionId ?? latest.currentSessionId;
    if (sid) {
      latest.currentSessionId = sid;
      latest.sessionId = sid;
      latest.lastEventId = null;
      notifyListeners(key);
      openSSEStream(key, sid);
    }
  } catch {
    const latest = _connections.get(key);
    if (!latest) return;
    if (latest.sendAbortController === sendCtrl) {
      latest.sendAbortController = null;
    }
    // User/system cancellation is handled by abortStore/closeConnection.
    if (sendCtrl.signal.aborted) return;

    latest.streaming = false;
    latest.activity = null;
    latest.messages = [...latest.messages, { role: 'error', content: 'Failed to send message', complete: true, msgId: nextMsgId(latest) }];
    notifyListeners(key);
  }
}

// Keep legacy name as alias
export const sendMessage = sendMessageStore;

export async function abortStore(serverUrl: string) {
  const key = resolveServerKey(serverUrl);
  const entry = _connections.get(key);
  if (!entry) return;

  // Always reset local UI immediately, even if sessionId hasn't been assigned yet.
  entry.permissionQueue = [];
  entry.activity = null;
  entry.streaming = false;

  // Cancel pending POST /chat and active SSE stream.
  if (entry.sendAbortController) {
    entry.sendAbortController.abort();
    entry.sendAbortController = null;
  }
  closeSSEStream(key);
  notifyListeners(key);

  if (!entry.currentSessionId) return;
  try {
    await fetch(`${entry.baseUrl}/sessions/${entry.currentSessionId}/abort`, { method: 'POST' });
  } catch { /* ignore */ }
}

// Keep legacy name as alias
export const abortConnection = abortStore;

export async function respondPermissionStore(serverUrl: string, approved: boolean) {
  const key = resolveServerKey(serverUrl);
  const entry = _connections.get(key);
  if (!entry || entry.permissionQueue.length === 0 || !entry.currentSessionId) return;
  const current = entry.permissionQueue[0];
  entry.permissionQueue = entry.permissionQueue.slice(1);
  notifyListeners(key);
  try {
    await fetch(`${entry.baseUrl}/sessions/${entry.currentSessionId}/permission`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolUseID: current.toolUseID, approved }),
    });
  } catch { /* ignore */ }
}

export interface SessionConfig {
  model: string | null;
  mode: 'plan' | 'build' | null;
  permissionMode: PermissionMode | null;
}

export async function getSessionConfigStore(serverUrl: string, sessionId: string): Promise<SessionConfig | null> {
  const key = resolveServerKey(serverUrl);
  const entry = _connections.get(key);
  if (!entry) return null;
  try {
    const res = await fetch(`${entry.baseUrl}/sessions/${encodeURIComponent(sessionId)}/config`);
    if (!res.ok) return null;
    const json = await res.json() as { model?: string | null; mode?: 'plan' | 'build' | null; permissionMode?: PermissionMode | null };
    if (_connections.has(key)) {
      entry.permissionMode = json.permissionMode ?? 'ask-permissions';
      notifyListeners(key);
    }
    return {
      model: json.model ?? null,
      mode: json.mode ?? null,
      permissionMode: json.permissionMode ?? null,
    };
  } catch { return null; }
}

export async function patchSessionPermissionModeStore(serverUrl: string, sessionId: string | null, permissionMode: PermissionMode): Promise<void> {
  const key = resolveServerKey(serverUrl);
  const entry = _connections.get(key);
  if (!entry) return;
  // Optimistically update local state and clear pending permissions if auto-approving
  entry.permissionMode = permissionMode;
  if (permissionMode !== 'ask-permissions') {
    entry.permissionQueue = [];
  }
  notifyListeners(key);
  // Also clear global permissions SSE queue for this server optimistically
  const pEntry = _permissionsSSE.get(key);
  if (pEntry && permissionMode !== 'ask-permissions') {
    pEntry.permissions = [];
    notifyPermissionsListeners(key);
  }
  if (!sessionId) return;
  try {
    await fetch(`${entry.baseUrl}/sessions/${encodeURIComponent(sessionId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissionMode }),
    });
  } catch { /* ignore — local state already updated */ }
}

// --- Health ---

export async function healthStore(serverUrl: string): Promise<CompatResult> {
  const key = resolveServerKey(serverUrl);
  const entry = _connections.get(key);
  if (!entry) return { compatible: true };
  try {
    const res = await fetch(`${entry.baseUrl}/health`, {
      headers: { 'X-Client-Version': APP_VERSION },
    });
    if (!res.ok) throw new Error(`health ${res.status}`);
    const json = await res.json() as {
      cwd?: string;
      serverVersion?: string;
      clientVersionRange?: string;
    };
    if (!_connections.has(key)) return { compatible: true };
    if (json.cwd) entry.serverCwd = json.cwd;

    entry.serverVersion = json.serverVersion ?? null;
    entry.clientVersionRange = json.clientVersionRange ?? null;

    const result = checkVersionCompat(entry.serverVersion, entry.clientVersionRange);
    entry.versionCompatible = result.compatible;
    notifyListeners(key);
    return result;
  } catch (err) {
    throw err;  // let pollAll mark the dot red; compat alert is not shown for failures
  }
}

// --- Repos ---

export async function listReposStore(serverUrl: string) {
  const key = resolveServerKey(serverUrl);
  const entry = _connections.get(key);
  if (!entry) return;
  try {
    const res = await fetch(`${entry.baseUrl}/repos`);
    const json = await res.json() as { repos?: Repo[] };
    if (_connections.has(key)) {
      entry.repos = json.repos ?? [];
      notifyListeners(key);
    }
  } catch { /* ignore */ }
}

export async function getRepoDetailsStore(serverUrl: string, repoPath: string): Promise<void> {
  const key = resolveServerKey(serverUrl);
  const entry = _connections.get(key);
  if (!entry) return;
  try {
    const res = await fetch(`${entry.baseUrl}/repos/details?repoPath=${encodeURIComponent(repoPath)}`);
    const json = await res.json() as RepoDetails;
    if (_connections.has(key)) {
      entry.repoDetails = new Map(entry.repoDetails).set(repoPath, json);
      notifyListeners(key);
    }
  } catch { /* ignore */ }
}

export async function cloneRepoStore(serverUrl: string, gitUrl: string): Promise<void> {
  const key = resolveServerKey(serverUrl);
  const entry = _connections.get(key);
  if (!entry) return;
  entry.cloneStatus = { cloning: true, creating: false, error: null };
  notifyListeners(key);
  try {
    const res = await fetch(`${entry.baseUrl}/repos/clone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: gitUrl }),
    });
    const json = await res.json() as { path?: string; name?: string; error?: string };
    if (!_connections.has(key)) return;
    if (json.error) {
      entry.cloneStatus = { cloning: false, creating: false, error: json.error };
    } else {
      const repo: Repo = { path: json.path!, name: json.name!, isGit: true };
      entry.repos = [...entry.repos, repo];
      entry.cloneStatus = { cloning: false, creating: false, error: null };
    }
    notifyListeners(key);
  } catch (err) {
    if (_connections.has(key)) {
      entry.cloneStatus = { cloning: false, creating: false, error: String(err) };
      notifyListeners(key);
    }
  }
}

export async function createFolderStore(serverUrl: string, name: string): Promise<void> {
  const key = resolveServerKey(serverUrl);
  const entry = _connections.get(key);
  if (!entry) return;
  entry.cloneStatus = { cloning: false, creating: true, error: null };
  notifyListeners(key);
  try {
    const res = await fetch(`${entry.baseUrl}/folders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const json = await res.json() as { path?: string; name?: string; error?: string };
    if (!_connections.has(key)) return;
    if (json.error) {
      entry.cloneStatus = { cloning: false, creating: false, error: json.error };
    } else {
      const repo: Repo = { path: json.path!, name: json.name!, isGit: false };
      entry.repos = [...entry.repos, repo];
      entry.cloneStatus = { cloning: false, creating: false, error: null };
    }
    notifyListeners(key);
  } catch (err) {
    if (_connections.has(key)) {
      entry.cloneStatus = { cloning: false, creating: false, error: String(err) };
      notifyListeners(key);
    }
  }
}

export function clearCloneStatusStore(serverUrl: string) {
  const key = resolveServerKey(serverUrl);
  const entry = _connections.get(key);
  if (!entry) return;
  entry.cloneStatus = { cloning: false, creating: false, error: null };
  notifyListeners(key);
}

export function resetFileViewStore(serverUrl: string) {
  const key = resolveServerKey(serverUrl);
  const entry = _connections.get(key);
  if (!entry) return;
  entry.fileContent = null;
  entry.dirListing = null;
  notifyListeners(key);
}

// --- Sessions ---

export async function listSessionsStore(serverUrl: string, repoPath?: string, agent?: string): Promise<boolean> {
  const key = resolveServerKey(serverUrl);
  let entry = _connections.get(key);
  if (!entry) {
    openConnection(serverUrl);
    entry = _connections.get(key);
  }
  if (!entry) return false;
  try {
    const params = new URLSearchParams();
    if (repoPath) params.set('repoPath', repoPath);
    if (agent) params.set('agent', agent);
    const qs = params.toString();
    const res = await fetch(`${entry.baseUrl}/sessions${qs ? '?' + qs : ''}`);
    if (!res.ok) throw new Error(`Failed to list sessions: ${res.status}`);
    const json = await res.json() as { sessions?: Session[] };
    if (_connections.has(key)) {
      entry.sessionsList = json.sessions ?? [];
      notifyListeners(key);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function initSessionStore(serverUrl: string, id: string | null, agent?: string | null, repoPath?: string | null) {
  const key = resolveServerKey(serverUrl);
  const entry = _connections.get(key);
  if (!entry) return;
  // Cancel any SSE re-attached by the AppState foreground handler before history loads.
  // Without this, replayed SSE assistant events arrive after history (all complete:true),
  // see the last message as complete, and append a duplicate incomplete copy.
  closeSSEStream(serverUrl);
  entry.currentSessionId = id;
  entry.sessionId = id;
  entry.sdkSessionId = null;
  if (agent !== undefined) entry.currentAgent = agent ?? null;
  if (repoPath !== undefined) entry.currentRepoPath = repoPath ?? null;
  entry.messages = [];
  entry.activity = null;
  entry.sessionLoading = !!id;
  notifyListeners(key);

  if (id) {
    try {
      const params = new URLSearchParams();
      if (agent) params.set('agent', agent);
      if (repoPath) params.set('repoPath', repoPath);
      const qs = params.toString();
      const res = await fetch(`${entry.baseUrl}/sessions/${id}/history${qs ? '?' + qs : ''}`);
      type HistoryContentBlock = { type: 'text'; text: string } | { type: 'tool_use'; tool_name: string; tool_input: string };
      type HistoryMessage = { role: string; content: string | HistoryContentBlock[] };
      const json = await res.json() as { messages?: HistoryMessage[] };
      if (_connections.has(key)) {
        const msgs = json.messages ?? [];
        const expanded: Message[] = [];
        for (const m of msgs) {
          if (Array.isArray(m.content)) {
            for (const block of m.content) {
              if (block.type === 'text' && block.text.trim()) {
                expanded.push({ role: m.role as Message['role'], content: block.text, complete: true, msgId: nextMsgId(entry) });
              } else if (block.type === 'tool_use') {
                let displayInput = block.tool_input;
                // opencode sends raw JSON — try to extract a human-readable string
                try {
                  const parsed = JSON.parse(block.tool_input);
                  if (parsed && typeof parsed === 'object') {
                    const val = Object.values(parsed)[0];
                    if (typeof val === 'string') displayInput = val;
                  }
                } catch { /* already a plain string */ }
                expanded.push({ role: 'tool', content: `${block.tool_name}: ${displayInput}`, complete: true, msgId: nextMsgId(entry) });
              }
            }
          } else {
            expanded.push({
              role: m.role as Message['role'],
              content: m.content as string,
              complete: true,
              msgId: nextMsgId(entry),
            });
          }
        }
        entry.messages = expanded;
        entry.sessionLoading = false;
        notifyListeners(key);
      }
    } catch {
      entry.sessionLoading = false;
      notifyListeners(key);
    }

    // Check if the server is still actively streaming for this session.
    // If so, set streaming=true immediately (so UI shows abort button / disabled input)
    // and re-attach the SSE stream to receive remaining events.
    try {
      const statusRes = await fetch(`${entry.baseUrl}/sessions/${id}/status`);
      if (statusRes.ok && _connections.has(key)) {
        const statusJson = await statusRes.json() as { streaming?: boolean };
        if (statusJson.streaming) {
          entry.streaming = true;
          entry.activity = { label: 'Thinking' };
          notifyListeners(key);
          openSSEStream(key, id);
        }
      }
    } catch { /* ignore — status endpoint unavailable, assume not streaming */ }
  }
}

// --- File ops ---

const _dirAbortControllers = new Map<string, AbortController>();
const _fileAbortControllers = new Map<string, AbortController>();

export async function listDirStore(serverUrl: string, path: string, repoPath: string) {
  const key = resolveServerKey(serverUrl);
  const entry = _connections.get(key);
  if (!entry) return;

  const prevCtrl = _dirAbortControllers.get(key);
  if (prevCtrl) prevCtrl.abort();
  const ctrl = new AbortController();
  _dirAbortControllers.set(key, ctrl);

  entry.dirListing = null;
  notifyListeners(key);

  try {
    const params = new URLSearchParams({ repoPath, path });
    const res = await fetch(`${entry.baseUrl}/dir?${params.toString()}`, { signal: ctrl.signal });
    const json = await res.json() as { entries?: DirEntry[] };
    if (_connections.has(key)) {
      entry.dirListing = json.entries ?? [];
      notifyListeners(key);
    }
  } catch { /* aborted or error */ }
}

export async function readFileStore(serverUrl: string, path: string, repoPath: string) {
  const key = resolveServerKey(serverUrl);
  const entry = _connections.get(key);
  if (!entry) return;

  const prevCtrl = _fileAbortControllers.get(key);
  if (prevCtrl) prevCtrl.abort();
  const ctrl = new AbortController();
  _fileAbortControllers.set(key, ctrl);

  try {
    const params = new URLSearchParams({ repoPath, path });
    const res = await fetch(`${entry.baseUrl}/file?${params.toString()}`, { signal: ctrl.signal });
    const json = await res.json() as { content: string; size: number };
    if (_connections.has(key)) {
      entry.fileContent = { path, content: json.content, size: json.size };
      notifyListeners(key);
    }
  } catch { /* aborted or error */ }
}

export async function getDiffsStore(serverUrl: string, repoPath?: string) {
  const key = resolveServerKey(serverUrl);
  const entry = _connections.get(key);
  if (!entry) return;
  try {
    const params = new URLSearchParams();
    if (repoPath) params.set('repoPath', repoPath);
    const qs = params.toString();
    const res = await fetch(`${entry.baseUrl}/diffs${qs ? '?' + qs : ''}`);
    const json = await res.json() as { diff?: string };
    if (_connections.has(key)) {
      entry.diffs = json.diff ?? null;
      notifyListeners(key);
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
