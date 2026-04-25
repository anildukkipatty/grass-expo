import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUser } from './auth-store';

const URLS_KEY = 'grass_server_urls';
const OLD_URLS_KEY = 'grass_ws_urls';
const VM_URL_KEY = 'grass_vm_url';
const LAST_TAB_KEY = 'grass_last_active_tab';

// ─── Per-user custom VM URLs (survive logout, keyed by email) ─────────────────

function customUrlsKey(email: string): string {
  return `GRASS_CUSTOM_URLS_${email}`;
}

async function getPerUserCustomUrls(): Promise<string[]> {
  try {
    const user = await getUser();
    if (!user) return [];
    const raw = await AsyncStorage.getItem(customUrlsKey(user.email));
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

async function savePerUserCustomUrl(url: string): Promise<void> {
  try {
    const user = await getUser();
    if (!user) return;
    const key = customUrlsKey(user.email);
    const raw = await AsyncStorage.getItem(key);
    const urls: string[] = raw ? JSON.parse(raw) : [];
    if (!urls.includes(url)) {
      urls.push(url);
      await AsyncStorage.setItem(key, JSON.stringify(urls));
    }
  } catch {}
}

async function removePerUserCustomUrl(url: string): Promise<void> {
  try {
    const user = await getUser();
    if (!user) return;
    const key = customUrlsKey(user.email);
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return;
    const urls: string[] = JSON.parse(raw);
    await AsyncStorage.setItem(key, JSON.stringify(urls.filter(u => u !== url)));
  } catch {}
}

export async function getUrls(): Promise<string[]> {
  // One-time migration: convert old ws:// URLs to http://
  const oldRaw = await AsyncStorage.getItem(OLD_URLS_KEY);
  if (oldRaw) {
    try {
      const oldUrls = JSON.parse(oldRaw) as string[];
      const migrated = oldUrls.map(u =>
        u.replace(/^ws:\/\//, 'http://').replace(/^wss:\/\//, 'https://')
      );
      await AsyncStorage.setItem(URLS_KEY, JSON.stringify(migrated));
      await AsyncStorage.removeItem(OLD_URLS_KEY);
      return migrated;
    } catch { /* fall through to new key */ }
  }

  // Merge: primary VM URL + per-user custom URLs + legacy URLS_KEY (for migration)
  const primaryUrl = await AsyncStorage.getItem(VM_URL_KEY);
  const perUserCustom = await getPerUserCustomUrls();

  const raw = await AsyncStorage.getItem(URLS_KEY);
  const legacyUrls: string[] = raw ? (JSON.parse(raw) as string[]) : [];

  // Migrate any legacy custom URLs (non-primary) into the per-user store once
  const legacyCustom = legacyUrls.filter(u => u !== primaryUrl);
  for (const u of legacyCustom) {
    await savePerUserCustomUrl(u);
  }

  // Build deduplicated list: primary first, then custom
  const seen = new Set<string>();
  const result: string[] = [];
  for (const u of [primaryUrl, ...perUserCustom, ...legacyCustom]) {
    if (u && !seen.has(u)) {
      seen.add(u);
      result.push(u);
    }
  }
  return result;
}

export async function saveUrl(url: string): Promise<void> {
  // Persist to per-user store so this URL survives logout
  await savePerUserCustomUrl(url);
  // Also update legacy URLS_KEY so in-flight reads stay consistent
  const urls = await getUrls();
  if (!urls.includes(url)) {
    urls.push(url);
    await AsyncStorage.setItem(URLS_KEY, JSON.stringify(urls));
  }
}

/** Save a VM preview URL, replacing the previous VM URL in the list. */
export async function saveVmUrl(url: string): Promise<void> {
  const oldVmUrl = await AsyncStorage.getItem(VM_URL_KEY);
  const urls = await getUrls();
  const filtered = oldVmUrl ? urls.filter((u) => u !== oldVmUrl) : urls;
  if (!filtered.includes(url)) {
    filtered.unshift(url);
  }
  await AsyncStorage.setItem(VM_URL_KEY, url);
  _cachedPrimaryVmUrl = url;
  await AsyncStorage.setItem(URLS_KEY, JSON.stringify(filtered));
}

export async function removeUrl(url: string): Promise<void> {
  await removePerUserCustomUrl(url);

  // Do not call getUrls() here: it performs legacy migration side-effects that can
  // re-add a just-removed custom URL back into the per-user store.
  const raw = await AsyncStorage.getItem(URLS_KEY);
  const urls: string[] = raw ? (JSON.parse(raw) as string[]) : [];
  const filtered = urls.filter((u) => u !== url);
  await AsyncStorage.setItem(URLS_KEY, JSON.stringify(filtered));
}

export const GRASS_VM_KEY = 'grassvm';

export async function getPrimaryVmUrl(): Promise<string | null> {
  return AsyncStorage.getItem(VM_URL_KEY);
}

let _cachedPrimaryVmUrl: string | null = null;

export function getCachedPrimaryVmUrl(): string | null {
  return _cachedPrimaryVmUrl;
}

export async function refreshPrimaryVmUrl(): Promise<string | null> {
  _cachedPrimaryVmUrl = await AsyncStorage.getItem(VM_URL_KEY);
  return _cachedPrimaryVmUrl;
}

export function resolveServerKey(url: string): string {
  return (_cachedPrimaryVmUrl && url === _cachedPrimaryVmUrl) ? GRASS_VM_KEY : url;
}

export function resolveServerUrl(key: string): string {
  if (key === GRASS_VM_KEY && _cachedPrimaryVmUrl) {
    return _cachedPrimaryVmUrl;
  }
  return key;
}

export async function saveLastActiveTab(url: string): Promise<void> {
  await AsyncStorage.setItem(LAST_TAB_KEY, url);
}

export async function getLastActiveTab(): Promise<string | null> {
  return AsyncStorage.getItem(LAST_TAB_KEY);
}

// Returns true if the URL looks like a relay session URL: /s/<token>
export function isRelayUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return /^\/s\/[^/]+/.test(parsed.pathname);
  } catch {
    return false;
  }
}

// Extracts the relay base host for display (e.g. "relay.example.com")
export function relayHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export async function clearUrls(): Promise<void> {
  // Write empty arrays first to avoid any stale reads racing remove calls.
  await AsyncStorage.multiSet([
    [URLS_KEY, JSON.stringify([])],
    [OLD_URLS_KEY, JSON.stringify([])],
  ]);
  _cachedPrimaryVmUrl = null;
  await AsyncStorage.multiRemove([URLS_KEY, OLD_URLS_KEY, VM_URL_KEY, LAST_TAB_KEY]);
}
