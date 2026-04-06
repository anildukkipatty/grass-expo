import AsyncStorage from '@react-native-async-storage/async-storage';
import { resolveServerKey } from './url-store';

const STORAGE_KEY = 'grass_threads_v1';
const MAX_THREADS = 50;

export interface Thread {
  id: string;        // sessionId
  title: string;
  repo: string;      // repoName (display)
  repoPath: string;
  tool: string;      // agent
  serverUrl: string;
  time: string;      // ISO timestamp of last interaction
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
  const idx = list.findIndex(t => t.id === thread.id);
  if (idx !== -1) {
    list.splice(idx, 1);
  }
  list.unshift({ ...thread, serverUrl: key });
  _map[key] = list.slice(0, MAX_THREADS);
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
