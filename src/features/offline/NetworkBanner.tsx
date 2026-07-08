import { useNetInfo } from "@react-native-community/netinfo";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui";

/** Thin banner overlaid at the top while offline. */
export function NetworkBanner() {
  const net = useNetInfo();
  const insets = useSafeAreaInsets();
  if (net.isConnected !== false) return null;

  return (
    <View
      pointerEvents="none"
      style={{ position: "absolute", top: 0, left: 0, right: 0, paddingTop: insets.top, zIndex: 50 }}
      className="bg-destructive"
    >
      <Text className="py-1 text-center text-xs font-jakarta-semibold text-destructive-foreground">
        You&apos;re offline — changes will sync when you reconnect
      </Text>
    </View>
  );
}
