import AsyncStorage from '@react-native-async-storage/async-storage';

const URLS_KEY = 'grass_server_urls';
const OLD_URLS_KEY = 'grass_ws_urls';
const VM_URL_KEY = 'grass_vm_url';
const LAST_TAB_KEY = 'grass_last_active_tab';

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

  const raw = await AsyncStorage.getItem(URLS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export async function saveUrl(url: string): Promise<void> {
  const urls = await getUrls();
  if (!urls.includes(url)) {
    urls.unshift(url);
    await AsyncStorage.setItem(URLS_KEY, JSON.stringify(urls));
  }
}

/** Save a VM preview URL, replacing the previous VM URL in the list. */
export async function saveVmUrl(url: string): Promise<void> {
  const oldVmUrl = await AsyncStorage.getItem(VM_URL_KEY);
  const urls = await getUrls();
  console.log('[saveVmUrl] new url:', url);
  console.log('[saveVmUrl] old VM url from key:', oldVmUrl);
  console.log('[saveVmUrl] urls before filter:', JSON.stringify(urls));
  const filtered = oldVmUrl ? urls.filter((u) => u !== oldVmUrl) : urls;
  console.log('[saveVmUrl] urls after filter:', JSON.stringify(filtered));
  if (!filtered.includes(url)) {
    filtered.unshift(url);
  }
  console.log('[saveVmUrl] final urls:', JSON.stringify(filtered));
  await AsyncStorage.setItem(VM_URL_KEY, url);
  _cachedPrimaryVmUrl = url;
  await AsyncStorage.setItem(URLS_KEY, JSON.stringify(filtered));
}

export async function removeUrl(url: string): Promise<void> {
  const urls = await getUrls();
  const filtered = urls.filter(u => u !== url);
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
  if (_cachedPrimaryVmUrl && url === _cachedPrimaryVmUrl) {
    return GRASS_VM_KEY;
  }
  return url;
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

export async function clearUrls(): Promise<void> {
  // Write empty arrays first to avoid any stale reads racing remove calls.
  await AsyncStorage.multiSet([
    [URLS_KEY, JSON.stringify([])],
    [OLD_URLS_KEY, JSON.stringify([])],
  ]);
  _cachedPrimaryVmUrl = null;
  await AsyncStorage.multiRemove([URLS_KEY, OLD_URLS_KEY, VM_URL_KEY, LAST_TAB_KEY]);
}
