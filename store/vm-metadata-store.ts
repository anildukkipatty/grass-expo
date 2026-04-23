import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUser } from './auth-store';

const METADATA_KEY = 'GRASS_VM_METADATA';
const LEGACY_VM_NAME_KEY = 'GRASS_VM_NAME';

async function vmNameKey(): Promise<string> {
  const user = await getUser();
  return user ? `GRASS_VM_NAME_${user.email}` : LEGACY_VM_NAME_KEY;
}

export interface VmMetadata {
  name: string;
  iconIndex: number;
}

type MetadataMap = Record<string, VmMetadata>;

export async function getVmMetadata(url: string): Promise<VmMetadata | null> {
  try {
    const raw = await AsyncStorage.getItem(METADATA_KEY);
    if (!raw) return null;
    const map: MetadataMap = JSON.parse(raw);
    return map[url] ?? null;
  } catch {
    return null;
  }
}

export async function setVmMetadata(url: string, meta: VmMetadata): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(METADATA_KEY);
    const map: MetadataMap = raw ? JSON.parse(raw) : {};
    map[url] = meta;
    await AsyncStorage.setItem(METADATA_KEY, JSON.stringify(map));
  } catch {}
}

export async function getAllVmMetadata(): Promise<MetadataMap> {
  try {
    const raw = await AsyncStorage.getItem(METADATA_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as MetadataMap;
  } catch {
    return {};
  }
}

export async function removeVmMetadata(url: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(METADATA_KEY);
    if (!raw) return;
    const map: MetadataMap = JSON.parse(raw);
    delete map[url];
    await AsyncStorage.setItem(METADATA_KEY, JSON.stringify(map));
  } catch {}
}

export async function clearAllVmMetadata(): Promise<void> {
  try {
    await AsyncStorage.removeItem(METADATA_KEY);
  } catch {}
}

export async function getVmName(): Promise<string | null> {
  try {
    const key = await vmNameKey();
    const value = await AsyncStorage.getItem(key);
    if (value !== null) return value;
    // Migrate from legacy global key to per-user key on first read
    if (key !== LEGACY_VM_NAME_KEY) {
      const legacy = await AsyncStorage.getItem(LEGACY_VM_NAME_KEY);
      if (legacy !== null) {
        await AsyncStorage.setItem(key, legacy);
        return legacy;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function setVmName(name: string): Promise<void> {
  try {
    const key = await vmNameKey();
    await AsyncStorage.setItem(key, name);
  } catch {}
}
