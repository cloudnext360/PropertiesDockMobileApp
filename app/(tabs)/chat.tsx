import { MessageCircle } from "lucide-react-native";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui";
import { useThemeTokens } from "@/theme/theme-provider";

/**
 * Chats tab. Messaging isn't built on the backend yet, so this renders an
 * empty state; when conversations land, the list replaces the placeholder body.
 */
export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const tokens = useThemeTokens();

  return (
    <View className="flex-1 bg-white dark:bg-background">
      <View style={{ paddingTop: insets.top }} className="px-4">
        <View className="h-14 justify-center">
          <Text className="text-2xl font-jakarta-extrabold text-foreground">Chats</Text>
        </View>
      </View>

      <View className="flex-1 items-center justify-center gap-3 px-10">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-brand/10">
          <MessageCircle size={28} color={tokens.brand} />
        </View>
        <Text className="text-center font-jakarta-bold text-foreground">No messages yet</Text>
        <Text className="text-center text-sm text-muted-foreground">
          Chat with agents and buyers about listings. Your conversations will appear here.
        </Text>
      </View>
    </View>
  );
}
