import { useRouter } from "expo-router";
import { Search } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui/text";
import { useThemeTokens } from "@/theme/theme-provider";

/**
 * Home top bar: brand wordmark on the left + a search entry point on the right.
 * Insets the top safe area itself (used as a custom `header` on the Home tab).
 */
export function HomeHeader() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const tokens = useThemeTokens();

  return (
    <View style={{ paddingTop: insets.top }} className="border-b border-border bg-card">
      <View className="h-14 flex-row items-center justify-between px-4">
        <Text className="text-xl font-jakarta-extrabold text-brand">PropertiesDock</Text>
        <Pressable
          onPress={() => router.push("/search")}
          accessibilityRole="button"
          accessibilityLabel="Search properties"
          className="h-10 w-10 items-center justify-center rounded-full active:bg-muted"
        >
          <Search size={22} color={tokens.foreground} />
        </Pressable>
      </View>
    </View>
  );
}
