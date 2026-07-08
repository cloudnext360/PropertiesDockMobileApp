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
import { NetworkBanner } from "@/features/offline/NetworkBanner";
import { AppThemeProvider } from "@/theme/theme-provider";
import { navigationDarkTheme, navigationLightTheme } from "@/theme";

// Keep the splash screen up until fonts are ready.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

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
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
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
            {/* Authenticated app shell (bottom tabs) */}
            <Stack.Screen name="(tabs)" />
            {/* Public routes: auth, verify-email, complete-profile */}
            <Stack.Screen name="(public)" />
            {/* Property detail — full-bleed, custom in-screen back button */}
            <Stack.Screen name="property/[slug]" options={{ headerShown: false }} />
            {/* Deep-link targets (mirror web URLs) */}
            <Stack.Screen name="agency/[slug]" options={{ headerShown: true, title: "Agency" }} />
            <Stack.Screen name="users/[id]" options={{ headerShown: true, title: "Profile" }} />
            <Stack.Screen name="profile/[username]" options={{ headerShown: true, title: "Profile" }} />
            {/* Dev-only design-system QA screen */}
            <Stack.Screen name="theme-gallery" options={{ headerShown: true, title: "Theme Gallery" }} />
            <Stack.Screen name="+not-found" options={{ headerShown: true, title: "Not found" }} />
          </Stack>
        </ThemeProvider>
      </AppThemeProvider>
    </Providers>
  );
}
