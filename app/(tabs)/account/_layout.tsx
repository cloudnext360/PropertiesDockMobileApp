import { Stack } from "expo-router";

import { AuthGate } from "@/components/auth-gate";
import { useThemeTokens } from "@/theme/theme-provider";

/**
 * The Account tab is the folded web dashboard. The whole subtree is gated by
 * AuthGate (mirrors web DashboardShell).
 *
 * "index" just redirects into the tab strip (see AccountShell); the four
 * sub-screens it hosts — listings, inquiries, saved-properties, settings —
 * render their own chrome (pinned profile header + segmented tabs), so their
 * native header is hidden. Genuinely pushed screens (edit, profile) keep the
 * themed header + back button.
 */
export default function AccountStackLayout() {
  const tokens = useThemeTokens();
  return (
    <AuthGate>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: tokens.card },
          headerTintColor: tokens.foreground,
          headerShadowVisible: false,
          headerTitleStyle: { fontFamily: "PlusJakartaSans_600SemiBold" },
        }}
      >
        {/* The four dashboard tabs share identical chrome (AccountShell). Disabling
            the transition makes switching between them read as only the inner
            content changing, not a full-screen slide. */}
        <Stack.Screen name="index" options={{ headerShown: false, animation: "none" }} />
        <Stack.Screen name="listings" options={{ headerShown: false, animation: "none" }} />
        <Stack.Screen name="inquiries" options={{ headerShown: false, animation: "none" }} />
        <Stack.Screen name="saved-properties" options={{ headerShown: false, animation: "none" }} />
        <Stack.Screen name="settings" options={{ headerShown: false, animation: "none" }} />
        <Stack.Screen name="edit" options={{ title: "Edit Profile" }} />
        <Stack.Screen name="profile" options={{ title: "Profile" }} />
      </Stack>
    </AuthGate>
  );
}
