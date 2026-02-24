import AsyncStorage from '@react-native-async-storage/async-storage';

const URLS_KEY = 'grass_ws_urls';

export async function getUrls(): Promise<string[]> {
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
