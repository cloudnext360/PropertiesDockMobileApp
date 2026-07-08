import { Pressable } from "react-native";

import { Text } from "@/components/ui";
import { cn } from "@/lib/utils";

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
}

/** Selectable pill with a ≥44pt touch target. */
export function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={cn(
        "min-h-11 items-center justify-center rounded-full border px-4",
        selected ? "border-brand bg-brand" : "border-border bg-card active:bg-muted",
      )}
    >
      <Text
        className={cn(
          "text-sm font-jakarta-medium",
          selected ? "text-brand-foreground" : "text-foreground",
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
}
