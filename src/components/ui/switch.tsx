import * as SwitchPrimitive from "@rn-primitives/switch";

import { cn } from "@/lib/utils";

export function Switch({ className, checked, disabled, ...props }: SwitchPrimitive.RootProps) {
  return (
    <SwitchPrimitive.Root
      checked={checked}
      disabled={disabled}
      className={cn(
        "h-6 w-11 flex-row items-center rounded-full px-0.5",
        checked ? "bg-primary" : "bg-input",
        disabled && "opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "h-5 w-5 rounded-full bg-background shadow-sm",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </SwitchPrimitive.Root>
  );
}
