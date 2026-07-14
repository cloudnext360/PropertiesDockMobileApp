import { View } from "react-native";

import { MotiView } from "@/components/ui/moti";

/** Three-dot "typing…" bubble shown above the composer while the partner types. */
export function TypingIndicator() {
  return (
    <View className="items-start px-4 pb-1 pt-1">
      <View className="flex-row items-center gap-1 rounded-2xl rounded-bl-md bg-muted px-4 py-3">
        {[0, 1, 2].map((i) => (
          <MotiView
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
            from={{ opacity: 0.3, translateY: 0 }}
            animate={{ opacity: 1, translateY: -2 }}
            transition={{
              type: "timing",
              duration: 400,
              loop: true,
              repeatReverse: true,
              delay: i * 150,
            }}
          />
        ))}
      </View>
    </View>
  );
}
