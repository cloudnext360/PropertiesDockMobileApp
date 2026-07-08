import { Stack } from "expo-router";

/**
 * Public / unauthenticated routes (MOBILE_PLAN.md §6):
 *   auth · verify-email · complete-profile.
 * These sit outside the tab shell.
 */
export default function PublicLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="auth" />
      <Stack.Screen name="verify-email" />
      <Stack.Screen name="complete-profile" />
    </Stack>
  );
}
