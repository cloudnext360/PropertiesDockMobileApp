import { TextInput, type TextInputProps } from "react-native";

import { cn } from "@/lib/utils";
import { useThemeTokens } from "@/theme/theme-provider";

export function Input({
  className,
  placeholderTextColor,
  editable = true,
  ...props
}: TextInputProps) {
  const tokens = useThemeTokens();
  return (
    <TextInput
      editable={editable}
      placeholderTextColor={placeholderTextColor ?? tokens.mutedForeground}
      className={cn(
        "h-11 rounded-md border border-input bg-background px-3 text-base text-foreground",
        !editable && "opacity-50",
        className,
      )}
      {...props}
    />
  );
}
