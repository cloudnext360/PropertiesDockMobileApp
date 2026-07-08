import { View } from "react-native";

import { FadeInView } from "@/components/ui/fade-in";
import { Text } from "@/components/ui/text";

interface PlaceholderProps {
  title: string;
  subtitle?: string;
  /** Primary endpoint(s) this screen will hit — from MOBILE_PLAN.md §4. */
  endpoint?: string;
}

/**
 * Centered placeholder body for screens that already sit under a navigation
 * header (tab/stack), so it does NOT inset the top safe area itself.
 */
export function Placeholder({ title, subtitle, endpoint }: PlaceholderProps) {
  return (
    <View className="flex-1 items-center justify-center bg-background px-6">
      <FadeInView className="items-center gap-3">
        <Text className="text-2xl font-jakarta-bold text-brand">{title}</Text>
        {subtitle ? (
          <Text className="text-center text-base text-muted-foreground">{subtitle}</Text>
        ) : null}
        {endpoint ? (
          <Text className="mt-2 rounded-lg border border-border px-3 py-2 text-center text-xs font-jakarta-medium text-muted-foreground">
            {endpoint}
          </Text>
        ) : null}
      </FadeInView>
    </View>
  );
}
