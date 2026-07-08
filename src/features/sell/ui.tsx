import { Pressable, View } from "react-native";

import { Text } from "@/components/ui";
import { cn } from "@/lib/utils";

// Shared wizard primitives — RN port of web components/ListProperty/ui.tsx.

export function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View className="mb-1 gap-1">
      <Text className="text-xl font-jakarta-bold text-foreground">{title}</Text>
      <Text className="text-sm text-muted-foreground">{subtitle}</Text>
    </View>
  );
}

export function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-1.5">
      <Text className="text-sm font-jakarta-semibold text-foreground">
        {label}
        {required ? <Text className="text-sm text-destructive"> *</Text> : null}
      </Text>
      {children}
      {error ? <Text className="text-xs text-destructive">{error}</Text> : null}
    </View>
  );
}

/** Two-option segmented control (Residential/Commercial, Sale/Rent). */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  labelPrefix,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  labelPrefix?: string;
}) {
  return (
    <View className="flex-row gap-2">
      {options.map((opt) => (
        <SegmentButton
          key={opt}
          label={labelPrefix ? `${labelPrefix} ${opt}` : opt}
          selected={value === opt}
          onPress={() => onChange(opt)}
        />
      ))}
    </View>
  );
}

function SegmentButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={cn(
        "flex-1 items-center rounded-xl border-2 py-3",
        selected ? "border-brand bg-brand" : "border-border bg-card",
      )}
    >
      <Text
        className={cn(
          "text-sm font-jakarta-bold",
          selected ? "text-brand-foreground" : "text-muted-foreground",
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
}
