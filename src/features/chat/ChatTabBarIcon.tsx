import { MessageCircle } from "lucide-react-native";
import { View } from "react-native";

import { Text } from "@/components/ui";

import { useUnreadCount } from "./hooks";

/**
 * Chat tab icon with an unread badge. Lives as a component (not a bare icon) so
 * it can subscribe to `useUnreadCount` — the custom FloatingTabBar renders
 * `tabBarIcon` inside the provider tree, so hooks work here. Badge hides at 0.
 */
export function ChatTabBarIcon({ color, size }: { color: string; size: number }) {
  const { data: count = 0 } = useUnreadCount();

  return (
    <View style={{ width: size, height: size }}>
      <MessageCircle color={color} size={size} />
      {count > 0 ? (
        <View
          className="absolute -right-2 -top-1.5 h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1"
          style={{ borderWidth: 1.5, borderColor: "transparent" }}
        >
          <Text className="text-brand-foreground text-[10px] font-jakarta-bold">
            {count > 9 ? "9+" : count}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
