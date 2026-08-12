// SDK 54: expo-router v6 does not re-export the React Navigation themes —
// import them from @react-navigation/native (expo-router's own dependency).
import { DarkTheme, DefaultTheme } from "@react-navigation/native";

import { tokensDark, tokensLight } from "@/theme/tokens";

export * from "@/theme/tokens";

// React Navigation themes wired to our design tokens, consumed by the root
// <ThemeProvider> so native navigation chrome matches the app palette.
export const navigationLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: tokensLight.brand,
    background: tokensLight.background,
    card: tokensLight.card,
    text: tokensLight.foreground,
    border: tokensLight.border,
  },
};

export const navigationDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    // Was brandForeground, which only worked because it used to be near-white in
    // dark mode. Now that the brand pair flips (see global.css .dark:root), the
    // accent to use is the brand itself — matching navigationLightTheme.
    primary: tokensDark.brand,
    background: tokensDark.background,
    card: tokensDark.card,
    text: tokensDark.foreground,
    border: tokensDark.border,
  },
};
