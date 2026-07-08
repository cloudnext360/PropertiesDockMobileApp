import * as SelectPrimitive from "@rn-primitives/select";
import { Check, ChevronDown } from "lucide-react-native";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MotiView } from "@/components/ui/moti";
import { cn } from "@/lib/utils";
import { useThemeTokens } from "@/theme/theme-provider";

export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export type { Option } from "@rn-primitives/select";

export function SelectValue({ className, ...props }: SelectPrimitive.ValueProps) {
  return <SelectPrimitive.Value className={cn("text-base text-foreground", className)} {...props} />;
}

export function SelectTrigger({
  className,
  children,
  disabled,
  ...props
}: Omit<SelectPrimitive.TriggerProps, "children"> & { children?: ReactNode }) {
  const tokens = useThemeTokens();
  return (
    <SelectPrimitive.Trigger
      disabled={disabled}
      className={cn(
        "h-11 flex-row items-center justify-between rounded-md border border-input bg-background px-3",
        disabled && "opacity-50",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown size={16} color={tokens.mutedForeground} />
    </SelectPrimitive.Trigger>
  );
}

export function SelectContent({
  className,
  children,
  portalHost,
  ...props
}: SelectPrimitive.ContentProps & { portalHost?: string }) {
  const insets = useSafeAreaInsets();
  return (
    <SelectPrimitive.Portal hostName={portalHost}>
      <SelectPrimitive.Overlay style={StyleSheet.absoluteFill}>
        <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: "timing", duration: 120 }}>
          <SelectPrimitive.Content
            insets={{ top: insets.top, bottom: insets.bottom, left: 12, right: 12 }}
            className={cn(
              "z-50 min-w-[8rem] rounded-md border border-border bg-popover p-1 shadow-md",
              className,
            )}
            {...props}
          >
            <SelectPrimitive.Group>{children}</SelectPrimitive.Group>
          </SelectPrimitive.Content>
        </MotiView>
      </SelectPrimitive.Overlay>
    </SelectPrimitive.Portal>
  );
}

export function SelectItem({
  className,
  label,
  value,
  disabled,
  ...props
}: SelectPrimitive.ItemProps) {
  const tokens = useThemeTokens();
  return (
    <SelectPrimitive.Item
      label={label}
      value={value}
      disabled={disabled}
      className={cn(
        "flex-row items-center rounded-sm py-2 pl-8 pr-2 active:bg-accent",
        disabled && "opacity-50",
        className,
      )}
      {...props}
    >
      <View className="absolute left-2 h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check size={16} color={tokens.foreground} />
        </SelectPrimitive.ItemIndicator>
      </View>
      <SelectPrimitive.ItemText className="text-base text-popover-foreground" />
    </SelectPrimitive.Item>
  );
}

export function SelectLabel({ className, ...props }: SelectPrimitive.LabelProps) {
  return (
    <SelectPrimitive.Label
      className={cn("py-1.5 pl-8 pr-2 text-sm font-jakarta-semibold text-muted-foreground", className)}
      {...props}
    />
  );
}
