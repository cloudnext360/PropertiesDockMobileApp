import Constants from "expo-constants";

/**
 * Typed runtime config. Mirrors the web repo's `NEXT_PUBLIC_API_URL` pattern.
 *
 * Resolution order:
 *   1. process.env.EXPO_PUBLIC_API_URL  (Expo inlines EXPO_PUBLIC_* at build time)
 *   2. expoConfig.extra.apiUrl          (injected in app.config.ts, read via expo-constants)
 *   3. dev-server LAN host              (so a physical device can reach the PC's backend)
 *   4. http://localhost:5000            (default — matches the local backend)
 */
const extra = (Constants.expoConfig?.extra ?? {}) as { apiUrl?: string };

/**
 * In development, when the app is served from the Metro dev server, derive the
 * backend from the dev machine's LAN IP — e.g. hostUri "192.168.1.20:8081" →
 * "http://192.168.1.20:5000". A physical phone can't reach "localhost" (that's the
 * phone), so this makes on-device dev work without setting EXPO_PUBLIC_API_URL.
 * Simulators/emulators report localhost and fall through to the default.
 */
function devHostApiUrl(): string | undefined {
  if (!__DEV__) return undefined;
  const hostUri =
    (Constants.expoConfig as { hostUri?: string } | null)?.hostUri ??
    (Constants as unknown as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig
      ?.debuggerHost;
  const host = hostUri?.split(":")[0];
  if (!host || host === "localhost" || host === "127.0.0.1") return undefined;
  return `http://${host}:5000`;
}

export interface AppConfig {
  apiUrl: string;
}

export const config: AppConfig = {
  apiUrl:
    process.env.EXPO_PUBLIC_API_URL ?? extra.apiUrl ?? devHostApiUrl() ?? "http://localhost:5000",
};

// resolveImageUrl now lives in @/lib/utils (mirrors web lib/utils.ts).
