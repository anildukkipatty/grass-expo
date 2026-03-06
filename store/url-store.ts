import AsyncStorage from '@react-native-async-storage/async-storage';

const URLS_KEY = 'grass_server_urls';
const OLD_URLS_KEY = 'grass_ws_urls';

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

export async function removeUrl(url: string): Promise<void> {
  const urls = await getUrls();
  const filtered = urls.filter(u => u !== url);
  await AsyncStorage.setItem(URLS_KEY, JSON.stringify(filtered));
}
