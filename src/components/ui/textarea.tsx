import { TextInput, type TextInputProps } from "react-native";

import { cn } from "@/lib/utils";
import { useThemeTokens } from "@/theme/theme-provider";

export function Textarea({
  className,
  placeholderTextColor,
  editable = true,
  ...props
}: TextInputProps) {
  const tokens = useThemeTokens();
  return (
    <TextInput
      multiline
      textAlignVertical="top"
      editable={editable}
      placeholderTextColor={placeholderTextColor ?? tokens.mutedForeground}
      className={cn(
        "min-h-24 rounded-md border border-input bg-background px-3 py-2 text-base text-foreground",
        !editable && "opacity-50",
        className,
      )}
      {...props}
    />
  );
}
