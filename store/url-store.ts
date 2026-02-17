import AsyncStorage from '@react-native-async-storage/async-storage';

const URL_KEY = 'grass_ws_url';

export async function getUrl(): Promise<string | null> {
  return AsyncStorage.getItem(URL_KEY);
}

export async function saveUrl(url: string): Promise<void> {
  await AsyncStorage.setItem(URL_KEY, url);
}
