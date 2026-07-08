import { useColorScheme } from "nativewind";
import { useEffect, type ReactNode } from "react";

import { tokensDark, tokensLight } from "@/theme/tokens";

/**
 * Forces the color scheme to light on mount, matching the web app's next-themes
 * config (`defaultTheme="light"`, `enableSystem={false}`). Dark mode still works —
 * it's just opt-in via `useColorScheme().setColorScheme("dark")` rather than the OS.
 */
export function AppThemeProvider({ children }: { children: ReactNode }) {
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    setColorScheme("light");
  }, [setColorScheme]);

  return <>{children}</>;
}

/** Concrete token values for the active scheme — for props that need a color string
 * (placeholderTextColor, icon `color`, ActivityIndicator, etc.). */
export function useThemeTokens() {
  const { colorScheme } = useColorScheme();
  return colorScheme === "dark" ? tokensDark : tokensLight;
}

/** Convenience re-export so screens/gallery can flip the scheme for QA. */
export { useColorScheme };
