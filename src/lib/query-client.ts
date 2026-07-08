import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient } from "@tanstack/react-query";

// Mobile-sensible defaults. `gcTime` is long so the persisted cache survives
// app restarts (used by PersistQueryClientProvider in components/providers.tsx).
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 60_000, // 1 min — data is fresh briefly, avoids refetch storms
      gcTime: 1000 * 60 * 60 * 24, // 24h — keep for offline/persistence
      refetchOnReconnect: true,
      refetchOnWindowFocus: false, // n/a on native
    },
    mutations: { retry: 0 },
  },
});

/**
 * Optional cache persistence. NOTE: this persists the *query cache* (property
 * lists, profile, etc.) — NOT auth tokens. Tokens live in expo-secure-store.
 * Wire via <PersistQueryClientProvider persistOptions={{ persister }}>.
 */
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "PROPERTYDOCK_QUERY_CACHE",
});
