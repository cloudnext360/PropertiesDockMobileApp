import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";
import { useThemeTokens } from "@/theme/theme-provider";

/**
 * Floating pill bottom nav (mirrors the design reference): a rounded card that
 * hovers over the page background, with the active tab lit as a brand-filled
 * circle. Rendered via the `tabBar` prop of expo-router's <Tabs>.
 *
 * It reserves its own height (not absolutely positioned), so tab screens keep
 * their content clear of the bar without any per-screen padding changes.
 *
 * The prop shape is a structural subset of React Navigation's BottomTabBarProps —
 * kept local so we don't import from expo-router's vendored build paths.
 */
type TabBarIcon = (props: { focused: boolean; color: string; size: number }) => ReactNode;

export interface FloatingTabBarProps {
  state: { index: number; routes: { key: string; name: string }[] };
  descriptors: Record<
    string,
    { options: { tabBarIcon?: TabBarIcon; tabBarAccessibilityLabel?: string; title?: string } }
  >;
  navigation: {
    emit: (event: { type: "tabPress"; target: string; canPreventDefault: true }) => {
      defaultPrevented: boolean;
    };
    navigate: (name: string) => void;
  };
}

export function FloatingTabBar({ state, descriptors, navigation }: FloatingTabBarProps) {
  const tokens = useThemeTokens();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{ paddingBottom: Math.max(insets.bottom, 12), backgroundColor: tokens.background }}
      className="px-6 pt-2"
    >
      <View
        className="h-16 flex-row items-center justify-between rounded-full bg-card px-3"
        style={{
          shadowColor: "#000",
          shadowOpacity: 0.12,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
          elevation: 12,
        }}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const icon = options.tabBarIcon;

          const onPress = () => {
            haptics.light();
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? options.title}
              className="h-12 w-12 items-center justify-center active:opacity-70"
            >
              <View
                // Explicit 24px radius (half of 48) — `rounded-full` (9999) can
                // render as a rectangle on Android. overflow-hidden guarantees the clip.
                style={{ borderRadius: 24, overflow: "hidden" }}
                className={cn(
                  "h-12 w-12 items-center justify-center",
                  focused && "bg-brand",
                )}
              >
                {icon?.({
                  focused,
                  color: focused ? tokens.brandForeground : tokens.mutedForeground,
                  size: 22,
                })}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
