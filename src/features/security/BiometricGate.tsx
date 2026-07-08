import * as LocalAuthentication from "expo-local-authentication";
import { Lock } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AppState, Platform, View } from "react-native";

import { Button, Text } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useThemeTokens } from "@/theme/theme-provider";

/**
 * Biometric app-unlock. Locks whenever a session exists AND the device has enrolled
 * biometrics — on cold start and on each return from background. Degrades gracefully:
 * no hardware / not enrolled / web → never locks.
 */
export function BiometricGate({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const tokens = useThemeTokens();
  const [available, setAvailable] = useState(false);
  const [locked, setLocked] = useState(false);
  const [checking, setChecking] = useState(false);
  // The system Face ID / passcode prompt backgrounds the app; these refs let the
  // AppState listener tell "returning from our own prompt" apart from a real
  // background → foreground transition, so unlocking doesn't re-trigger the lock.
  const authInProgress = useRef(false);
  const prevAppState = useRef(AppState.currentState);

  const authenticate = useCallback(async () => {
    if (authInProgress.current) return;
    authInProgress.current = true;
    setChecking(true);
    try {
      const res = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock PropertyDock",
        fallbackLabel: "Use passcode",
      });
      if (res.success) setLocked(false);
    } catch {
      // leave locked; the user can retry
    } finally {
      setChecking(false);
      // Keep the flag up briefly: the prompt's dismissal fires a trailing
      // "active" AppState event after authenticateAsync resolves.
      setTimeout(() => {
        authInProgress.current = false;
      }, 750);
    }
  }, []);

  // Lock, then immediately show the biometric prompt.
  const lock = useCallback(() => {
    setLocked(true);
    authenticate();
  }, [authenticate]);

  // Detect capability + perform the initial lock once auth has resolved.
  // setState happens after `await`, so it isn't a synchronous effect-body update.
  useEffect(() => {
    if (Platform.OS === "web") return;
    let active = true;
    (async () => {
      try {
        const ok =
          (await LocalAuthentication.hasHardwareAsync()) &&
          (await LocalAuthentication.isEnrolledAsync());
        if (!active) return;
        setAvailable(ok);
        if (ok && !isLoading && user) lock();
      } catch {
        if (active) setAvailable(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user, isLoading, lock]);

  // Re-lock when returning to the foreground (state set inside the event callback).
  // Skip transitions caused by our own auth prompt (authInProgress) and brief
  // "inactive" blips (notification shade, incoming call banner) — only a real
  // trip through "background" re-arms the lock.
  useEffect(() => {
    if (Platform.OS === "web" || !available || !user) return;
    const sub = AppState.addEventListener("change", (state) => {
      const cameFromBackground = prevAppState.current === "background";
      prevAppState.current = state;
      if (state === "active" && cameFromBackground && !authInProgress.current) lock();
    });
    return () => sub.remove();
  }, [available, user, lock]);

  if (locked) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-background px-8">
        <Lock size={40} color={tokens.brand} />
        <Text className="text-lg font-jakarta-bold text-foreground">PropertyDock is locked</Text>
        <Text className="text-center text-sm text-muted-foreground">
          Unlock with Face ID / fingerprint to continue.
        </Text>
        <Button variant="brand" loading={checking} onPress={authenticate}>
          Unlock
        </Button>
      </View>
    );
  }

  return <>{children}</>;
}
