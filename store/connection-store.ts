import { AppState } from 'react-native';
import { useState, useEffect, useRef } from 'react';

export interface Message {
  role: 'user' | 'assistant' | 'error';
  content: string;
  complete: boolean;
  msgId: string;
  wsId?: string;
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
  ws: WebSocket | null;
  pingInterval: ReturnType<typeof setInterval> | null;
  pongTimeout: ReturnType<typeof setTimeout> | null;
  reconnectTimeout: ReturnType<typeof setTimeout> | null;
  connectTimeout: ReturnType<typeof setTimeout> | null;
  reconnectDelay: number;
  msgCounter: number;
  currentSessionId: string | null;
  currentAgent: string | null;
  currentRepoPath: string | null;
  active: boolean;

  connected: boolean;
  reconnecting: boolean;
  streaming: boolean;
  messages: Message[];
  activity: { label: string } | null;
  permissionQueue: PermissionItem[];
  sessionId: string | null;
  sessionsList: Session[];
  cwd: string | null;
  agent: string | null;
  repos: Repo[];
  diffs: string | null;
  dirListing: DirEntry[] | null;
  fileContent: FileContentResult | null;
  cloneStatus: { cloning: boolean; creating: boolean; error: string | null };

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

function clearTimers(url: string) {
  const entry = _connections.get(url);
  if (!entry) return;
  if (entry.pingInterval) { clearInterval(entry.pingInterval); entry.pingInterval = null; }
  if (entry.pongTimeout) { clearTimeout(entry.pongTimeout); entry.pongTimeout = null; }
  if (entry.reconnectTimeout) { clearTimeout(entry.reconnectTimeout); entry.reconnectTimeout = null; }
  if (entry.connectTimeout) { clearTimeout(entry.connectTimeout); entry.connectTimeout = null; }
}

function stopPing(url: string) {
  const entry = _connections.get(url);
  if (!entry) return;
  if (entry.pingInterval) { clearInterval(entry.pingInterval); entry.pingInterval = null; }
  if (entry.pongTimeout) { clearTimeout(entry.pongTimeout); entry.pongTimeout = null; }
}

function startPing(url: string) {
  const entry = _connections.get(url);
  if (!entry) return;
  stopPing(url);
  entry.pingInterval = setInterval(() => {
    if (entry.ws && entry.ws.readyState === WebSocket.OPEN) {
      entry.ws.send(JSON.stringify({ type: 'ping' }));
      entry.pongTimeout = setTimeout(() => {
        entry.ws?.close();
      }, 5000);
    }
  }, 30000);
}

function scheduleReconnect(url: string) {
  const entry = _connections.get(url);
  if (!entry || !entry.active) return;
  const delay = entry.reconnectDelay;
  entry.reconnectDelay = Math.min(delay * 2, 30000);
  entry.reconnectTimeout = setTimeout(() => {
    if (!entry.active) return;
    entry.reconnecting = true;
    notifyListeners(url);
    connect(url);
  }, delay);
}

function connect(url: string) {
  const entry = _connections.get(url);
  if (!entry) return;

  if (entry.reconnectTimeout) { clearTimeout(entry.reconnectTimeout); entry.reconnectTimeout = null; }
  if (entry.connectTimeout) { clearTimeout(entry.connectTimeout); entry.connectTimeout = null; }

  let ws: WebSocket;
  try {
    ws = new WebSocket(url);
  } catch {
    scheduleReconnect(url);
    return;
  }
  entry.ws = ws;

  entry.connectTimeout = setTimeout(() => {
    if (ws.readyState === WebSocket.CONNECTING) {
      ws.close();
    }
  }, 5000);

  ws.onopen = () => {
    if (entry.connectTimeout) { clearTimeout(entry.connectTimeout); entry.connectTimeout = null; }
    if (!entry.active || !_connections.has(url)) { ws.close(); return; }
    entry.connected = true;
    entry.reconnecting = false;
    entry.reconnectDelay = 1000;
    startPing(url);
    ws.send(JSON.stringify({ type: 'get_cwd' }));
    ws.send(JSON.stringify({ type: 'list_repos' }));
    if (entry.currentRepoPath) {
      ws.send(JSON.stringify({ type: 'select_repo', path: entry.currentRepoPath }));
    }
    if (entry.currentAgent) {
      ws.send(JSON.stringify({ type: 'select_agent', agent: entry.currentAgent }));
    }
    ws.send(JSON.stringify({ type: 'list_sessions' }));
    if (entry.currentSessionId) {
      ws.send(JSON.stringify({ type: 'init', sessionId: entry.currentSessionId }));
    }
    notifyListeners(url);
  };

  ws.onclose = () => {
    if (entry.connectTimeout) { clearTimeout(entry.connectTimeout); entry.connectTimeout = null; }
    if (!entry.active) return;
    if (!_connections.has(url)) return;
    entry.connected = false;
    entry.permissionQueue = [];
    stopPing(url);
    scheduleReconnect(url);
    notifyListeners(url);
  };

  ws.onerror = () => ws.close();

  ws.onmessage = (event) => {
    if (!_connections.has(url)) return;
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(event.data as string);
    } catch {
      return;
    }

    if (data.type === 'pong') {
      if (entry.pongTimeout) { clearTimeout(entry.pongTimeout); entry.pongTimeout = null; }
      return;
    }

    if (data.type === 'sessions_list') {
      entry.sessionsList = (data.sessions as Session[]) || [];
      notifyListeners(url);
      return;
    }

    if (data.type === 'cwd') {
      entry.cwd = (data.cwd as string) ?? null;
      entry.agent = (data.agent as string) ?? null;
      notifyListeners(url);
      return;
    }

    if (data.type === 'diffs') {
      entry.diffs = (data.diff as string) ?? null;
      notifyListeners(url);
      return;
    }

    if (data.type === 'repos_list') { entry.repos = (data.repos as Repo[]) || []; notifyListeners(url); return; }
    if (data.type === 'repo_selected') { notifyListeners(url); return; }

    if (data.type === 'repo_cloned') {
      const repo: Repo = { path: data.path as string, name: data.name as string, isGit: true };
      entry.repos = [...entry.repos, repo];
      entry.cloneStatus = { cloning: false, creating: false, error: null };
      notifyListeners(url);
      return;
    }

    if (data.type === 'folder_created') {
      const repo: Repo = { path: data.path as string, name: data.name as string, isGit: false };
      entry.repos = [...entry.repos, repo];
      entry.cloneStatus = { cloning: false, creating: false, error: null };
      notifyListeners(url);
      return;
    }

    if (data.type === 'dir_listing') {
      entry.dirListing = (data.entries as DirEntry[]) ?? [];
      notifyListeners(url);
      return;
    }
    if (data.type === 'file_content') {
      entry.fileContent = {
        path: data.path as string,
        content: data.content as string,
        size: data.size as number,
      };
      notifyListeners(url);
      return;
    }

    if (data.type === 'session_status') {
      entry.streaming = data.streaming as boolean;
      if (data.streaming) {
        entry.activity = { label: 'Working...' };
      }
      notifyListeners(url);
      return;
    }

    if (data.type === 'permission_request') {
      if (!entry.permissionQueue.some(p => p.toolUseID === data.toolUseID)) {
        entry.permissionQueue = [...entry.permissionQueue, {
          toolUseID: data.toolUseID as string,
          toolName: data.toolName as string,
          input: (data.input as Record<string, unknown>) || {},
        }];
        notifyListeners(url);
      }
      return;
    }

    if (data.type === 'system' && data.subtype === 'init') {
      const d = data.data as Record<string, unknown> | undefined;
      if (d?.session_id) {
        const sid = d.session_id as string;
        entry.currentSessionId = sid;
        entry.sessionId = sid;
        notifyListeners(url);
      }
      return;
    }

    if (data.type === 'history') {
      const msgs = (data.messages as Array<{ role: string; content: string }>) || [];
      entry.messages = msgs.map((m) => ({
        role: m.role as Message['role'],
        content: m.content,
        complete: true,
        msgId: nextMsgId(entry),
      }));
      notifyListeners(url);
      return;
    }

    if (data.type === 'assistant') {
      entry.activity = null;
      const wsId = data.id as string;
      const content = data.content as string;
      const prev = entry.messages;
      const last = prev[prev.length - 1];
      if (last && last.role === 'assistant' && !last.complete && last.wsId === wsId) {
        entry.messages = [...prev.slice(0, -1), { ...last, content }];
      } else {
        entry.messages = [...prev, { role: 'assistant', content, complete: false, msgId: nextMsgId(entry), wsId }];
      }
      notifyListeners(url);
    } else if (data.type === 'status') {
      const status = data.status as string;
      if (status === 'thinking') {
        entry.activity = { label: 'Thinking' };
      } else if (status === 'tool') {
        const elapsed = data.elapsed != null ? Math.round(data.elapsed as number) + 's' : '';
        entry.activity = { label: (data.tool_name as string) + (elapsed ? ' (' + elapsed + ')' : '') };
      } else if (status === 'tool_summary') {
        entry.activity = { label: data.summary as string };
      } else {
        entry.activity = null;
      }
      notifyListeners(url);
    } else if (data.type === 'tool_use') {
      entry.activity = { label: (data.tool_name as string) + ': ' + (data.tool_input as string) };
      notifyListeners(url);
    } else if (data.type === 'result') {
      entry.streaming = false;
      entry.activity = null;
      const cost = data.cost != null ? '$' + (data.cost as number).toFixed(4) : null;
      const duration = data.duration_ms != null ? ((data.duration_ms as number) / 1000).toFixed(1) + 's' : null;
      const badge = [cost, duration].filter(Boolean).join(' · ');
      const lastIdx = entry.messages.length - 1;
      entry.messages = entry.messages.map((msg, i) =>
        msg.role === 'assistant' && !msg.complete
          ? { ...msg, complete: true, ...(i === lastIdx ? { badge } : {}) }
          : msg
      );
      notifyListeners(url);
    } else if (data.type === 'aborted') {
      entry.streaming = false;
      entry.activity = null;
      entry.messages = [...entry.messages, { role: 'error', content: '⚠️ ' + (data.message as string), complete: true, msgId: nextMsgId(entry) }];
      notifyListeners(url);
    } else if (data.type === 'error') {
      entry.streaming = false;
      entry.activity = null;
      if (entry.cloneStatus.cloning || entry.cloneStatus.creating) {
        entry.cloneStatus = { ...entry.cloneStatus, cloning: false, creating: false, error: data.message as string };
      } else {
        entry.messages = [...entry.messages, { role: 'error', content: data.message as string, complete: true, msgId: nextMsgId(entry) }];
      }
      notifyListeners(url);
    }
  };
}

// AppState handling — runs once on import
let _appStateValue = AppState.currentState;
AppState.addEventListener('change', (next) => {
  if (_appStateValue === next) return;
  _appStateValue = next;
  if (next !== 'active') {
    for (const [url, entry] of _connections) {
      entry.active = false;
      clearTimers(url);
      entry.ws?.close();
      entry.ws = null;
      entry.connected = false;
      entry.reconnecting = false;
    }
    _globalListeners.forEach(fn => fn());
  } else {
    for (const [url, entry] of _connections) {
      entry.active = true;
      entry.reconnecting = true;
      connect(url);
    }
    _globalListeners.forEach(fn => fn());
  }
});

// Exported functions

export function openConnection(url: string) {
  if (_connections.has(url)) return;
  const entry: ConnectionEntry = {
    ws: null,
    pingInterval: null,
    pongTimeout: null,
    reconnectTimeout: null,
    connectTimeout: null,
    reconnectDelay: 1000,
    msgCounter: 0,
    currentSessionId: null,
    currentAgent: null,
    currentRepoPath: null,
    active: true,
    connected: false,
    reconnecting: true,
    streaming: false,
    messages: [],
    activity: null,
    permissionQueue: [],
    sessionId: null,
    sessionsList: [],
    cwd: null,
    agent: null,
    repos: [],
    diffs: null,
    dirListing: null,
    fileContent: null,
    cloneStatus: { cloning: false, creating: false, error: null },
    listeners: new Set(),
  };
  _connections.set(url, entry);
  connect(url);
  _globalListeners.forEach(fn => fn());
}

export function reconnectNow(url: string) {
  const entry = _connections.get(url);
  if (!entry) return;
  if (entry.connected) return;
  clearTimers(url);
  entry.ws?.close();
  entry.ws = null;
  entry.reconnectDelay = 1000;
  entry.reconnecting = true;
  entry.active = true;
  notifyListeners(url);
  connect(url);
}

export function closeConnection(url: string) {
  const entry = _connections.get(url);
  if (!entry) return;
  entry.active = false;
  clearTimers(url);
  entry.ws?.close();
  entry.ws = null;
  _connections.delete(url);
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

export function sendMessage(url: string, text: string) {
  const entry = _connections.get(url);
  if (!entry || !text.trim() || !entry.ws || entry.ws.readyState !== WebSocket.OPEN) return;
  entry.messages = [...entry.messages, { role: 'user', content: text, complete: true, msgId: nextMsgId(entry) }];
  entry.ws.send(JSON.stringify({ type: 'message', content: text }));
  entry.streaming = true;
  entry.activity = { label: 'Thinking' };
  notifyListeners(url);
}

export function abortConnection(url: string) {
  const entry = _connections.get(url);
  if (!entry || !entry.ws || entry.ws.readyState !== WebSocket.OPEN) return;
  entry.ws.send(JSON.stringify({ type: 'abort' }));
  entry.permissionQueue = [];
  notifyListeners(url);
}

export function respondPermissionStore(url: string, approved: boolean) {
  const entry = _connections.get(url);
  if (!entry || entry.permissionQueue.length === 0 || !entry.ws) return;
  const current = entry.permissionQueue[0];
  entry.ws.send(JSON.stringify({
    type: 'permission_response',
    toolUseID: current.toolUseID,
    approved,
  }));
  entry.permissionQueue = entry.permissionQueue.slice(1);
  notifyListeners(url);
}

export function listSessionsStore(url: string) {
  const entry = _connections.get(url);
  if (!entry || !entry.ws || entry.ws.readyState !== WebSocket.OPEN) return;
  entry.ws.send(JSON.stringify({ type: 'list_sessions' }));
}

export function initSessionStore(url: string, id: string | null) {
  const entry = _connections.get(url);
  if (!entry) return;
  entry.currentSessionId = id;
  entry.sessionId = id;
  entry.messages = [];
  entry.activity = null;
  if (entry.ws && entry.ws.readyState === WebSocket.OPEN && id) {
    entry.ws.send(JSON.stringify({ type: 'init', sessionId: id }));
  }
  notifyListeners(url);
}

export function getDiffsStore(url: string) {
  const entry = _connections.get(url);
  if (!entry || !entry.ws || entry.ws.readyState !== WebSocket.OPEN) return;
  entry.ws.send(JSON.stringify({ type: 'get_diffs' }));
}

export function listReposStore(url: string) {
  const entry = _connections.get(url);
  if (!entry || !entry.ws || entry.ws.readyState !== WebSocket.OPEN) return;
  entry.ws.send(JSON.stringify({ type: 'list_repos' }));
}

export function selectRepoStore(url: string, path: string) {
  const entry = _connections.get(url);
  if (!entry) return;
  entry.currentRepoPath = path;
  if (!entry.ws || entry.ws.readyState !== WebSocket.OPEN) return;
  entry.ws.send(JSON.stringify({ type: 'select_repo', path }));
}

export function selectAgentStore(url: string, agent: string) {
  const entry = _connections.get(url);
  if (!entry || !entry.ws || entry.ws.readyState !== WebSocket.OPEN) return;
  entry.currentAgent = agent;
  entry.ws.send(JSON.stringify({ type: 'select_agent', agent }));
  entry.ws.send(JSON.stringify({ type: 'list_sessions' }));
}

export function listDirStore(url: string, path: string, repoPath: string) {
  const entry = _connections.get(url);
  if (!entry || !entry.ws || entry.ws.readyState !== WebSocket.OPEN) return;
  entry.dirListing = null;
  notifyListeners(url);
  entry.ws.send(JSON.stringify({ type: 'list_dir', path, repoPath }));
}

export function cloneRepoStore(url: string, gitUrl: string) {
  const entry = _connections.get(url);
  if (!entry || !entry.ws || entry.ws.readyState !== WebSocket.OPEN) return;
  entry.cloneStatus = { cloning: true, creating: false, error: null };
  notifyListeners(url);
  entry.ws.send(JSON.stringify({ type: 'clone_repo', url: gitUrl }));
}

export function createFolderStore(url: string, name: string) {
  const entry = _connections.get(url);
  if (!entry || !entry.ws || entry.ws.readyState !== WebSocket.OPEN) return;
  entry.cloneStatus = { cloning: false, creating: true, error: null };
  notifyListeners(url);
  entry.ws.send(JSON.stringify({ type: 'create_folder', name }));
}

export function clearCloneStatusStore(url: string) {
  const entry = _connections.get(url);
  if (!entry) return;
  entry.cloneStatus = { cloning: false, creating: false, error: null };
  notifyListeners(url);
}

export function readFileStore(url: string, path: string, repoPath: string) {
  const entry = _connections.get(url);
  if (!entry || !entry.ws || entry.ws.readyState !== WebSocket.OPEN) return;
  entry.ws.send(JSON.stringify({ type: 'read_file', path, repoPath }));
}

export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';

export function useConnectionStatuses(): Map<string, ConnectionStatus> {
  const [, forceUpdate] = useState(0);
  const unsubRef = useRef<(() => void) | null>(null);
  if (!unsubRef.current) {
    unsubRef.current = subscribeToAll(() => forceUpdate(n => n + 1));
  }

  useEffect(() => {
    return () => { unsubRef.current?.(); unsubRef.current = null; };
  }, []);

  const result = new Map<string, ConnectionStatus>();
  for (const [url, entry] of _connections) {
    result.set(url, entry.connected ? 'connected' : entry.reconnecting ? 'reconnecting' : 'disconnected');
  }
  return result;
}
