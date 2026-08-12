import { useColorScheme } from "nativewind";
import { useEffect, type ReactNode } from "react";

import {
  loadThemePreference,
  setThemePreference,
  useThemeState,
  type ThemePreference,
} from "@/theme/theme-store";
import { tokensDark, tokensLight } from "@/theme/tokens";

// Start the persisted read at module load so the value is usually ready before the
// first paint (same trick as the onboarding flag).
loadThemePreference();

/**
 * Applies the user's saved theme choice to NativeWind.
 *
 * This used to hard-code `setColorScheme("light")` on mount, so any in-session
 * change was undone on the next launch. It now mirrors the persisted preference:
 * "light"/"dark" pin the scheme, "system" hands control back to the OS. The default
 * is still light, so installs that never touch the setting look unchanged.
 */
export function AppThemeProvider({ children }: { children: ReactNode }) {
  const { setColorScheme } = useColorScheme();
  const { ready, preference } = useThemeState();

  useEffect(() => {
    // Wait for the stored value — applying the default first makes the app flash
    // from light to dark for anyone who picked dark.
    if (!ready) return;
    setColorScheme(preference);
  }, [ready, preference, setColorScheme]);

  return <>{children}</>;
}

/**
 * Read/write the theme preference — backs the Appearance setting.
 *
 * `preference` is the user's literal choice, so it can be "system". When you need
 * the *resolved* light/dark value, use useColorScheme() or useThemeTokens().
 */
export function useThemePreference(): {
  preference: ThemePreference;
  setPreference: (next: ThemePreference) => void;
  ready: boolean;
} {
  const { ready, preference } = useThemeState();
  return { preference, setPreference: setThemePreference, ready };
}

/** Concrete token values for the active scheme — for props that need a color string
 * (placeholderTextColor, icon `color`, ActivityIndicator, etc.). */
export function useThemeTokens() {
  const { colorScheme } = useColorScheme();
  return colorScheme === "dark" ? tokensDark : tokensLight;
}

/** Convenience re-export so screens/gallery can flip the scheme for QA. */
export { useColorScheme };
export type { ThemePreference };
