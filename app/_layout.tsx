import "@/global.css";

import {
  PlusJakartaSans_200ExtraLight,
  PlusJakartaSans_300Light,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/plus-jakarta-sans";
import { ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "nativewind";
import { useEffect } from "react";

import { Providers } from "@/components/providers";
import { NativeCapabilities } from "@/features/notifications/NativeCapabilities";
import { loadOnboardingState, useOnboardingState } from "@/features/onboarding/onboarding-store";
import { NetworkBanner } from "@/features/offline/NetworkBanner";
import { AppThemeProvider } from "@/theme/theme-provider";
import { navigationDarkTheme, navigationLightTheme } from "@/theme";

// Keep the splash screen up until fonts + the onboarding flag are ready.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const onboarding = useOnboardingState();

  useEffect(() => {
    loadOnboardingState();
  }, []);

  // Plus Jakarta Sans — the exact weights used on web (200–800).
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_200ExtraLight,
    PlusJakartaSans_300Light,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded && onboarding.ready) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, onboarding.ready]);

  if (!fontsLoaded || !onboarding.ready) {
    return null;
  }

  return (
    <Providers>
      <AppThemeProvider>
        <ThemeProvider value={colorScheme === "dark" ? navigationDarkTheme : navigationLightTheme}>
          <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
          {/* Side-effect only: push registration + notification-tap routing */}
          <NativeCapabilities />
          <NetworkBanner />
          <Stack
            screenOptions={{
              headerShown: false,
              headerTitleStyle: { fontFamily: "PlusJakartaSans_600SemiBold" },
            }}
          >
            {/* First-launch onboarding (animated splash + slides). While unseen it is
                the only reachable route; completing it flips the guard and expo-router
                auto-redirects to the anchor route — the tab shell. */}
            <Stack.Protected guard={!onboarding.seen}>
              <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
            </Stack.Protected>
            <Stack.Protected guard={onboarding.seen}>
              {/* Authenticated app shell (bottom tabs) — fades in after onboarding */}
              <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
              {/* Public routes: auth, verify-email, complete-profile */}
              <Stack.Screen name="(public)" />
              {/* Property search — opened on demand from the Home search bar,
                  renders its own header + back button (no bottom tab). */}
              <Stack.Screen name="search" options={{ headerShown: false }} />
              {/* Property detail — full-bleed, custom in-screen back button */}
              <Stack.Screen name="property/[slug]" options={{ headerShown: false }} />
              {/* Deep-link targets (mirror web URLs) */}
              <Stack.Screen name="agency/[slug]" options={{ headerShown: true, title: "Agency" }} />
              <Stack.Screen name="users/[id]" options={{ headerShown: true, title: "Profile" }} />
              <Stack.Screen name="profile/[username]" options={{ headerShown: true, title: "Profile" }} />
              {/* Dev-only design-system QA screen */}
              <Stack.Screen name="theme-gallery" options={{ headerShown: true, title: "Theme Gallery" }} />
            </Stack.Protected>
            <Stack.Screen name="+not-found" options={{ headerShown: true, title: "Not found" }} />
          </Stack>
        </ThemeProvider>
      </AppThemeProvider>
    </Providers>
  );
}
