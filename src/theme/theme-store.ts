import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";

// Versioned key, same convention as pd_onboarding_seen_v1.
const THEME_PREFERENCE_KEY = "pd_theme_preference_v1";

/** What the user picked. "system" follows the OS setting. */
export type ThemePreference = "light" | "dark" | "system";

const VALID: readonly ThemePreference[] = ["light", "dark", "system"];

function isPreference(value: unknown): value is ThemePreference {
  return typeof value === "string" && (VALID as readonly string[]).includes(value);
}

interface ThemeState {
  /** False until the AsyncStorage read resolves. */
  ready: boolean;
  preference: ThemePreference;
}

/**
 * Tiny module store, mirroring features/onboarding/onboarding-store.ts (no zustand
 * in this repo). Kept outside React so the provider can apply the saved scheme on
 * the very first render pass instead of flashing the default first.
 *
 * Default is "light" — the app previously hard-coded light on every mount, so this
 * keeps existing installs looking identical until the user chooses otherwise.
 */
let state: ThemeState = { ready: false, preference: "light" };
const listeners = new Set<() => void>();

function emit(next: ThemeState) {
  state = next;
  listeners.forEach((listener) => listener());
}

let loadStarted = false;

/** Kick off the one-time read. Safe to call repeatedly. */
export function loadThemePreference(): void {
  if (loadStarted) return;
  loadStarted = true;
  AsyncStorage.getItem(THEME_PREFERENCE_KEY)
    .then((value) =>
      emit({ ready: true, preference: isPreference(value) ? value : "light" }),
    )
    // Fail-open to the default rather than leaving `ready` false forever.
    .catch(() => emit({ ready: true, preference: "light" }));
}

/** Apply immediately, persist in the background. */
export function setThemePreference(preference: ThemePreference): void {
  emit({ ready: true, preference });
  AsyncStorage.setItem(THEME_PREFERENCE_KEY, preference).catch(() => {});
}

export function useThemeState(): ThemeState {
  return useSyncExternalStore(
    (callback) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    () => state,
    () => state,
  );
}
