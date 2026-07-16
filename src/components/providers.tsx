import { PortalHost } from "@rn-primitives/portal";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { type ReactNode } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Toaster } from "sonner-native";

import { AuthProvider } from "@/context/AuthContext";
import { ChatSocketProvider } from "@/features/chat/ChatSocketProvider";
import "@/features/offline/online-manager"; // side effect: NetInfo → onlineManager
import { registerOfflineMutations } from "@/features/offline/offline-mutations";
import { asyncStoragePersister, queryClient } from "@/lib/query-client";

// Register default mutation fns so paused offline mutations can replay after restore.
registerOfflineMutations();

/**
 * App-wide providers, mirroring web app/providers.tsx:
 *   React Query (+ AsyncStorage persistence, offline mutation replay) + gesture
 *   handler + safe area + toasts + the portal host that overlays render into.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <SafeAreaProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: asyncStoragePersister }}
          onSuccess={() => {
            // Replay any mutations that were queued while offline.
            queryClient.resumePausedMutations();
          }}
        >
          <AuthProvider>
            <ChatSocketProvider>
              {children}
              <PortalHost />
              <Toaster />
            </ChatSocketProvider>
          </AuthProvider>
        </PersistQueryClientProvider>
        </SafeAreaProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
