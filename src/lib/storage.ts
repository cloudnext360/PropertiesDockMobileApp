import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Token keys match the web repo for continuity of the auth contract.
export const ACCESS_TOKEN_KEY = "pd_access_token";
export const REFRESH_TOKEN_KEY = "pd_refresh_token";

// expo-secure-store has NO web implementation (its native methods are undefined
// in the browser). On native we use the secure enclave (Keychain/Keystore); on
// web we fall back to localStorage — which is what the web app already uses.
const isWeb = Platform.OS === "web";

/**
 * Async token storage. Every call is async so the axios interceptors can await it.
 *   native → expo-secure-store   ·   web → localStorage
 */
export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    if (isWeb) return typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (isWeb) {
      if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async removeItem(key: string): Promise<void> {
    if (isWeb) {
      if (typeof localStorage !== "undefined") localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export async function getAccessToken(): Promise<string | null> {
  return secureStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return secureStorage.getItem(REFRESH_TOKEN_KEY);
}

export async function setTokens(accessToken: string, refreshToken: string): Promise<void> {
  await secureStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  await secureStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export async function clearTokens(): Promise<void> {
  await secureStorage.removeItem(ACCESS_TOKEN_KEY);
  await secureStorage.removeItem(REFRESH_TOKEN_KEY);
}
