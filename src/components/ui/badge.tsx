import { cva, type VariantProps } from "class-variance-authority";
import { View, type ViewProps } from "react-native";

import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

export const badgeVariants = cva("self-start rounded-full border px-2.5 py-0.5", {
  variants: {
    variant: {
      default: "border-transparent bg-primary",
      secondary: "border-transparent bg-secondary",
      destructive: "border-transparent bg-destructive",
      outline: "border-border",
      brand: "border-transparent bg-brand",
    },
  },
  defaultVariants: { variant: "default" },
});

const badgeTextVariants = cva("text-xs font-jakarta-semibold", {
  variants: {
    variant: {
      default: "text-primary-foreground",
      secondary: "text-secondary-foreground",
      destructive: "text-destructive-foreground",
      outline: "text-foreground",
      brand: "text-brand-foreground",
    },
  },
  defaultVariants: { variant: "default" },
});

export interface BadgeProps extends ViewProps, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, children, ...props }: BadgeProps) {
  return (
    <View className={cn(badgeVariants({ variant }), className)} {...props}>
      {typeof children === "string" ? (
        <Text className={cn(badgeTextVariants({ variant }))}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}
