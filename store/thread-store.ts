import AsyncStorage from '@react-native-async-storage/async-storage';
import { resolveServerKey } from './url-store';

const STORAGE_KEY = 'grass_threads_v2';
const MAX_THREADS = 50;

export interface Thread {
  grassId: string;        // GRASS UUID (from POST /chat response)
  sdkSessionId?: string;  // SDK session ID (from SSE system event; may differ from grassId for new claude-code threads)
  title: string;
  repo: string;           // repoName (display)
  repoPath: string;
  tool: string;           // agent
  serverUrl: string;
  time: string;           // ISO timestamp of last interaction
}

type ThreadMap = Record<string, Thread[]>; // keyed by serverUrl

let _map: ThreadMap = {};
let _loaded = false;
let _listeners: Array<() => void> = [];

function notify() {
  _listeners.forEach(fn => fn());
}

async function load(): Promise<void> {
  if (_loaded) return;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    _map = raw ? JSON.parse(raw) : {};
  } catch {
    _map = {};
  }
  _loaded = true;
}

async function persist(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(_map));
  } catch {}
}

export async function getThreadsForServer(serverUrl: string): Promise<Thread[]> {
  await load();
  const key = resolveServerKey(serverUrl);
  return [...(_map[key] ?? [])];
}

export async function upsertThread(thread: Thread): Promise<void> {
  await load();
  const key = resolveServerKey(thread.serverUrl);
  const list = _map[key] ?? [];
  const idx = list.findIndex(t =>
    t.grassId === thread.grassId ||
    (thread.sdkSessionId && t.sdkSessionId === thread.sdkSessionId) ||
    (thread.sdkSessionId && t.grassId === thread.sdkSessionId) ||
    (t.sdkSessionId && t.sdkSessionId === thread.grassId)
  );
  if (idx !== -1) {
    list.splice(idx, 1);
  }
  list.unshift({ ...thread, serverUrl: key });
  _map[key] = list.slice(0, MAX_THREADS);
  notify();
  await persist();
}

export async function findThreadById(sessionId: string): Promise<Thread | null> {
  await load();
  for (const list of Object.values(_map)) {
    const thread = list.find(t =>
      t.grassId === sessionId || t.sdkSessionId === sessionId
    );
    if (thread) return thread;
  }
  return null;
}

export async function clearAllThreads(): Promise<void> {
  _map = {};
  notify();
  await AsyncStorage.removeItem(STORAGE_KEY);
}

// Drop local threads for a (server, agent, repoPath) tuple whose grassId/sdkSessionId
// is no longer returned by the server. Threads for other agents or other repos are
// untouched. A grace window protects freshly-created local threads.
export async function pruneThreads(opts: {
  serverUrl: string;
  agent: string;
  repoPath?: string;
  keepIds: Set<string>;
  graceMs?: number;
}): Promise<void> {
  const { serverUrl, agent, repoPath, keepIds, graceMs = 5 * 60_000 } = opts;
  // An empty keep set is ambiguous — could be a fresh server, a wiped opencode
  // store, or a transient bug. Refuse to prune in that case so we never wipe
  // the user's local history on a single suspicious response.
  if (keepIds.size === 0) return;
  await load();
  const key = resolveServerKey(serverUrl);
  const list = _map[key];
  if (!list || list.length === 0) return;
  const now = Date.now();
  const filtered = list.filter(t => {
    // Only consider pruning threads from the same agent + repo we just fetched.
    const sameScope = t.tool === agent && (!repoPath || t.repoPath === repoPath);
    if (!sameScope) return true;
    if (keepIds.has(t.grassId)) return true;
    if (t.sdkSessionId && keepIds.has(t.sdkSessionId)) return true;
    return (now - new Date(t.time).getTime()) < graceMs;
  });
  if (filtered.length === list.length) return;
  _map[key] = filtered;
  notify();
  await persist();
}

export function subscribeThreads(fn: () => void): () => void {
  _listeners.push(fn);
  return () => { _listeners = _listeners.filter(f => f !== fn); };
}

export function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
