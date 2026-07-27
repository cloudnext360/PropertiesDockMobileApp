import { MessageCircle } from "lucide-react-native";
import { View } from "react-native";

import { Text } from "@/components/ui";
import { useThemeTokens } from "@/theme/theme-provider";

import { useUnreadCount } from "./hooks";

/**
 * Chat tab icon with an unread badge. Lives as a component (not a bare icon) so
 * it can subscribe to `useUnreadCount` — the custom FloatingTabBar renders
 * `tabBarIcon` inside the provider tree, so hooks work here. Badge hides at 0.
 */
export function ChatTabBarIcon({ color, size }: { color: string; size: number }) {
  const { data: count = 0 } = useUnreadCount();
  const tokens = useThemeTokens();

  return (
    <View style={{ width: size, height: size }}>
      <MessageCircle color={color} size={size} />
      {count > 0 ? (
        <View
          className="absolute -right-2 -top-1.5 h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1"
          style={{ borderWidth: 1.5, borderColor: tokens.card }}
        >
          <Text
            className="text-brand-foreground text-[10px] font-jakarta-bold"
            // includeFontPadding:false + matched lineHeight vertically center the
            // tiny glyph in the 16px badge (Android adds font padding otherwise).
            style={{ includeFontPadding: false, textAlign: "center", lineHeight: 12 }}
          >
            {count > 9 ? "9+" : count}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
