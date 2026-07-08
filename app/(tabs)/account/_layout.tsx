import { Stack } from "expo-router";

import { AuthGate } from "@/components/auth-gate";
import { useThemeTokens } from "@/theme/theme-provider";

// The Account tab is the folded web dashboard. The whole subtree is gated by
// AuthGate (mirrors web DashboardShell). Sub-screens get themed headers + back.
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
        <Stack.Screen name="index" options={{ title: "Account" }} />
        <Stack.Screen name="edit" options={{ title: "Edit Profile" }} />
        <Stack.Screen name="listings" options={{ title: "My Listings" }} />
        <Stack.Screen name="inquiries" options={{ title: "Inquiries" }} />
        <Stack.Screen name="saved-properties" options={{ title: "Saved Properties" }} />
        <Stack.Screen name="profile" options={{ title: "Profile" }} />
        <Stack.Screen name="settings" options={{ title: "Settings" }} />
        <Stack.Screen name="verification" options={{ title: "Verification" }} />
      </Stack>
    </AuthGate>
  );
}
