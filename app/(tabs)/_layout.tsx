import { Tabs } from "expo-router";
import { FileText, Heart, House, Plus, PlusCircle, User } from "lucide-react-native";

import { FloatingTabBar, type FloatingTabBarProps } from "@/components/floating-tab-bar";
import { ChatTabBarIcon } from "@/features/chat/ChatTabBarIcon";
import { useDoubleBackExit } from "@/hooks/useDoubleBackExit";
import { useThemeTokens } from "@/theme/theme-provider";

/**
 * Bottom-tab shell:
 *   Home · Chat · Sell · Saved · Account.
 * Property search is no longer a tab — it opens on demand from the Home search
 * bar (app/search.tsx). The bar is a custom floating pill (see FloatingTabBar);
 * the Account tab is a nested Stack (the folded web dashboard) — see
 * app/(tabs)/account/.
 */
export default function TabsLayout() {
  const tokens = useThemeTokens();

  // Android back: once tab history is exhausted, double-press-to-exit.
  useDoubleBackExit();

  return (
    <Tabs
      backBehavior="history"
      tabBar={(props) => <FloatingTabBar {...(props as unknown as FloatingTabBarProps)} />}
      screenOptions={{
        headerStyle: { backgroundColor: tokens.card },
        headerTintColor: tokens.foreground,
        headerShadowVisible: false,
        headerTitleStyle: { fontFamily: "PlusJakartaSans_600SemiBold" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false, // the Home screen renders its own header (location + bell)
          tabBarIcon: ({ color, size }) => <House color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          headerShown: false, // the Chat screen renders its own header
          tabBarIcon: ({ color, size }) => <ChatTabBarIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="sell"
        options={{
          title: "Sell",
          tabBarIcon: ({ color, size }) => <PlusCircle color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: "Saved",
          tabBarIcon: ({ color, size }) => <Heart color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          // headerShown: false, // the nested Account stack renders its own headers
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
