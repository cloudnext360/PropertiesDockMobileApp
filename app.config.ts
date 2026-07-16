import type { ConfigContext, ExpoConfig } from "expo/config";

/**
 * Dynamic config that extends the static app.json and injects typed env.
 * EXPO_PUBLIC_API_URL mirrors the web repo's NEXT_PUBLIC_API_URL. It is exposed
 * both directly on `process.env` (Expo inlines EXPO_PUBLIC_* at build) and via
 * `expoConfig.extra.apiUrl` so it can be read through expo-constants (src/lib/config.ts).
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  // Google Maps (Android) needs a Maps SDK key in the manifest or MapView crashes
  // at mount. Provided via EXPO_PUBLIC_GOOGLE_MAPS_API_KEY (set per eas.json profile).
  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  return {
    ...config,
    name: config.name ?? "PropertiesDock",
    slug: config.slug ?? "propertydockmobile",
    android: {
      ...config.android,
      ...(googleMapsApiKey
        ? {
            config: {
              ...(config.android?.config ?? {}),
              googleMaps: { apiKey: googleMapsApiKey },
            },
          }
        : {}),
    },
    extra: {
      ...config.extra,
      // Default to the live Render backend. For a local backend, override with
      // EXPO_PUBLIC_API_URL=http://localhost:5000 (or your LAN IP) before `expo start`.
      apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "https://propertydockbackend-2.onrender.com",
      // Exposed to JS so the map can render a fallback instead of crashing when unset.
      googleMapsApiKey,
    },
  };
};
