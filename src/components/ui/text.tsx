import { Text as RNText, type TextProps } from "react-native";

import { cn } from "@/lib/utils";

/**
 * Themed text primitive. Defaults to the foreground color + Plus Jakarta Sans.
 * Starter for the `components/ui` layer (React Native Reusables goes here — see
 * MOBILE_PLAN.md §1).
 */
export function Text({ className, ...props }: TextProps) {
  return <RNText className={cn("text-foreground font-sans", className)} {...props} />;
}
