import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/** SecureStore on device, localStorage on web (dev preview only — not secure). */
export const storage = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return globalThis.localStorage?.getItem(key) ?? null;
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') return globalThis.localStorage?.setItem(key, value);
    await SecureStore.setItemAsync(key, value);
  },
  async remove(key: string): Promise<void> {
    if (Platform.OS === 'web') return globalThis.localStorage?.removeItem(key);
    await SecureStore.deleteItemAsync(key);
  },
};

export const StorageKeys = {
  refreshToken: 'chairo.refreshToken',
  user: 'chairo.user',
  deviceId: 'chairo.deviceId',
  policyAccepted: 'chairo.policyAccepted',
} as const;
