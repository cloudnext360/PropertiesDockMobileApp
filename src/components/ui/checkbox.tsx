import * as CheckboxPrimitive from "@rn-primitives/checkbox";
import { Check } from "lucide-react-native";

import { cn } from "@/lib/utils";
import { useThemeTokens } from "@/theme/theme-provider";

export function Checkbox({ className, checked, disabled, ...props }: CheckboxPrimitive.RootProps) {
  const tokens = useThemeTokens();
  return (
    <CheckboxPrimitive.Root
      checked={checked}
      disabled={disabled}
      className={cn(
        "h-5 w-5 items-center justify-center rounded border-2 border-primary",
        checked && "bg-primary",
        disabled && "opacity-50",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="items-center justify-center">
        <Check size={14} strokeWidth={3} color={tokens.primaryForeground} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
