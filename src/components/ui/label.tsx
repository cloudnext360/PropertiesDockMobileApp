import * as LabelPrimitive from "@rn-primitives/label";

import { cn } from "@/lib/utils";

export function Label({
  className,
  onPress,
  ...props
}: LabelPrimitive.TextProps & { onPress?: () => void }) {
  return (
    <LabelPrimitive.Root onPress={onPress}>
      <LabelPrimitive.Text
        className={cn("text-sm font-jakarta-medium text-foreground", className)}
        {...props}
      />
    </LabelPrimitive.Root>
  );
}
