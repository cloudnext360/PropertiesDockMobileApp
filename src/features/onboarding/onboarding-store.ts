import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";

// Versioned so a future onboarding redesign can re-show itself by bumping the key.
const ONBOARDING_SEEN_KEY = "pd_onboarding_seen_v1";

interface OnboardingState {
  /** False until the AsyncStorage read resolves — keep the native splash up meanwhile. */
  ready: boolean;
  /** True once the user has completed (or skipped) onboarding. */
  seen: boolean;
}

// Tiny module store (no zustand in this repo): the root layout gates routes on it
// and the onboarding screen flips it, which re-renders the layout's <Stack.Protected>.
let state: OnboardingState = { ready: false, seen: false };
const listeners = new Set<() => void>();

function emit(next: OnboardingState) {
  state = next;
  listeners.forEach((listener) => listener());
}

let loadStarted = false;

/** Kick off the one-time AsyncStorage read. Safe to call repeatedly. */
export function loadOnboardingState(): void {
  if (loadStarted) return;
  loadStarted = true;
  AsyncStorage.getItem(ONBOARDING_SEEN_KEY)
    .then((value) => emit({ ready: true, seen: value === "1" }))
    // Fail-open: a broken storage layer must never trap the user in onboarding.
    .catch(() => emit({ ready: true, seen: true }));
}

/** Mark onboarding done — flips the route guard immediately, persists in the background. */
export function completeOnboarding(): void {
  emit({ ready: true, seen: true });
  AsyncStorage.setItem(ONBOARDING_SEEN_KEY, "1").catch(() => {});
}

/** Dev helper: clear the flag (e.g. from a debug menu) so onboarding shows again next launch. */
export async function resetOnboarding(): Promise<void> {
  await AsyncStorage.removeItem(ONBOARDING_SEEN_KEY);
}

export function useOnboardingState(): OnboardingState {
  return useSyncExternalStore(
    (callback) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    () => state,
    () => state,
  );
}
