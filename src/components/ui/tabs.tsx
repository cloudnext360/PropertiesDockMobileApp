import * as TabsPrimitive from "@rn-primitives/tabs";
import type { ReactNode } from "react";

import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: TabsPrimitive.ListProps) {
  return (
    <TabsPrimitive.List
      className={cn(
        "h-11 flex-row items-center justify-center rounded-md bg-muted p-1",
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  value,
  children,
  disabled,
  ...props
}: TabsPrimitive.TriggerProps & { children?: ReactNode }) {
  const { value: selected } = TabsPrimitive.useRootContext();
  const active = selected === value;
  return (
    <TabsPrimitive.Trigger
      value={value}
      disabled={disabled}
      className={cn(
        "flex-1 flex-row items-center justify-center rounded-sm px-3 py-1.5",
        active && "bg-background shadow-sm",
        disabled && "opacity-50",
        className,
      )}
      {...props}
    >
      {typeof children === "string" ? (
        <Text
          className={cn(
            "text-sm font-jakarta-medium",
            active ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </TabsPrimitive.Trigger>
  );
}

export function TabsContent({ className, ...props }: TabsPrimitive.ContentProps) {
  return <TabsPrimitive.Content className={cn("mt-3", className)} {...props} />;
}
