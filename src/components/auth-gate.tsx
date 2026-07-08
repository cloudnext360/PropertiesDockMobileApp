import { useRouter } from "expo-router";
import { useEffect, type ReactNode } from "react";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "@/context/AuthContext";
import { useThemeTokens } from "@/theme/theme-provider";

/**
 * Mirror of the web `DashboardShell` guard. Wrap any authenticated subtree.
 *   - while loading  → themed splash/spinner
 *   - no user        → redirect to /auth
 *   - user, no GeneralUser profile → redirect to /complete-profile
 *     (mirrors web login() returning false)
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { user, generalUser, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/auth");
    } else if (!generalUser) {
      router.replace("/complete-profile");
    }
  }, [isLoading, user, generalUser, router]);

  if (isLoading || !user || !generalUser) {
    return <AuthSplash />;
  }

  return <>{children}</>;
}

function AuthSplash() {
  const tokens = useThemeTokens();
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator size="large" color={tokens.brand} />
    </View>
  );
}
