// JS-side mirror of the design tokens in src/global.css, for places that need a
// concrete color string rather than a Tailwind class (e.g. navigation themes,
// tab-bar tint, status bar). React Native accepts `hsl(h, s%, l%)` strings directly.

export const tokensLight = {
  background: "hsl(160, 15%, 94%)",
  foreground: "hsl(220, 8%, 29%)",
  brand: "hsl(213, 100%, 12%)",
  brandForeground: "hsl(160, 23%, 98%)",
  brandDark: "hsl(180, 100%, 16%)",
  card: "hsl(0, 0%, 100%)",
  cardForeground: "hsl(222.2, 84%, 4.9%)",
  primary: "hsl(222.2, 47.4%, 11.2%)",
  primaryForeground: "hsl(210, 40%, 98%)",
  muted: "hsl(160, 20%, 96%)",
  mutedForeground: "hsl(220, 8%, 48%)",
  border: "hsl(214.3, 31.8%, 91.4%)",
  destructive: "hsl(0, 84.2%, 60.2%)",
} as const;

export const tokensDark = {
  background: "hsl(222.2, 84%, 4.9%)",
  foreground: "hsl(210, 40%, 98%)",
  brand: "hsl(213, 100%, 12%)", // brand is mode-invariant (matches web)
  brandForeground: "hsl(160, 23%, 98%)",
  brandDark: "hsl(180, 100%, 16%)",
  card: "hsl(222.2, 84%, 4.9%)",
  cardForeground: "hsl(210, 40%, 98%)",
  primary: "hsl(210, 40%, 98%)",
  primaryForeground: "hsl(222.2, 47.4%, 11.2%)",
  muted: "hsl(217.2, 32.6%, 17.5%)",
  mutedForeground: "hsl(215, 20.2%, 65.1%)",
  border: "hsl(217.2, 32.6%, 17.5%)",
  destructive: "hsl(0, 62.8%, 30.6%)",
} as const;

export type ThemeTokens = typeof tokensLight;
