import type { ConfigContext, ExpoConfig } from "expo/config";

/**
 * Dynamic config that extends the static app.json and injects typed env.
 * EXPO_PUBLIC_API_URL mirrors the web repo's NEXT_PUBLIC_API_URL. It is exposed
 * both directly on `process.env` (Expo inlines EXPO_PUBLIC_* at build) and via
 * `expoConfig.extra.apiUrl` so it can be read through expo-constants (src/lib/config.ts).
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? "PropertyDockMobile",
  slug: config.slug ?? "propertydockmobile",
  extra: {
    ...config.extra,
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5000",
  },
});
