import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Text } from "@/components/ui/text";

interface ScreenPlaceholderProps {
  title: string;
  subtitle?: string;
  /** The primary API endpoint(s) this screen will hit — from MOBILE_PLAN.md §4. */
  endpoint?: string;
}

/** Temporary scaffold screen. Replace with the real feature UI under src/features/. */
export function ScreenPlaceholder({ title, subtitle, endpoint }: ScreenPlaceholderProps) {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-3xl font-jakarta-extrabold text-brand">{title}</Text>
        {subtitle ? (
          <Text className="mt-3 text-center text-base text-muted-foreground">{subtitle}</Text>
        ) : null}
        {endpoint ? (
          <Text className="mt-6 rounded-lg border border-border px-3 py-2 text-center text-xs font-jakarta-medium text-muted-foreground">
            {endpoint}
          </Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
