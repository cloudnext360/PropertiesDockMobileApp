import { Link, Stack } from "expo-router";
import { View } from "react-native";

import { Text } from "@/components/ui/text";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View className="flex-1 items-center justify-center gap-4 bg-background px-6">
        <Text className="text-xl font-jakarta-bold">This screen doesn&apos;t exist.</Text>
        <Link href="/" className="text-brand font-jakarta-semibold">
          Go to home screen
        </Link>
      </View>
    </>
  );
}
