import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Stockage clé/valeur générique des préférences (non sensibles), persistant.
 * - Natif : expo-secure-store (déjà installé pour le token, on réutilise le même backend).
 * - Web : localStorage (SecureStore indisponible sur le web).
 */
const isWeb = Platform.OS === 'web';

export async function getItem(key: string): Promise<string | null> {
  if (isWeb) {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

export async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    globalThis.localStorage?.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}
