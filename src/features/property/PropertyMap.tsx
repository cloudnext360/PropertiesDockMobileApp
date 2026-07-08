import { View } from "react-native";

import { Text } from "@/components/ui";
import type { PropertyMapProps } from "@/features/property/PropertyMap.types";

/**
 * Web/default fallback. react-native-maps has no web implementation, so on web
 * (and as the TS resolution target) we render a notice. The real map lives in
 * PropertyMap.native.tsx and is used automatically on iOS/Android.
 */
export function PropertyMap(_props: PropertyMapProps) {
  return (
    <View className="flex-1 items-center justify-center bg-muted px-8">
      <Text className="text-center text-muted-foreground">
        Map view is available on the iOS / Android app.
      </Text>
    </View>
  );
}
