import * as Slot from "@rn-primitives/slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, type PressableProps } from "react-native";

import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { useThemeTokens } from "@/theme/theme-provider";

// Variant + size names mirror the web shadcn Button (button.tsx). `brand` is added
// because PropertyDock's primary CTAs use the brand color on web.
export const buttonVariants = cva(
  "flex-row items-center justify-center gap-2 rounded-md active:opacity-90 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary",
        brand: "bg-brand",
        destructive: "bg-destructive",
        outline: "border border-input bg-background",
        secondary: "bg-secondary",
        ghost: "",
        link: "",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 rounded-md px-3",
        lg: "h-12 rounded-md px-8",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export const buttonTextVariants = cva("text-sm font-jakarta-semibold", {
  variants: {
    variant: {
      default: "text-primary-foreground",
      brand: "text-brand-foreground",
      destructive: "text-destructive-foreground",
      outline: "text-foreground",
      secondary: "text-secondary-foreground",
      ghost: "text-foreground",
      link: "text-brand underline",
    },
    size: { default: "", sm: "", lg: "text-base", icon: "" },
  },
  defaultVariants: { variant: "default", size: "default" },
});

export interface ButtonProps
  extends Omit<PressableProps, "children">,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  asChild?: boolean;
  children?: ReactNode;
}

export function Button({
  className,
  variant,
  size,
  loading = false,
  disabled,
  asChild = false,
  children,
  ...props
}: ButtonProps) {
  const tokens = useThemeTokens();
  const isDisabled = disabled || loading;
  const classes = cn(buttonVariants({ variant, size }), isDisabled && "opacity-50", className);

  // asChild: clone the caller's element (e.g. an expo-router <Link>) — pass through.
  if (asChild) {
    return (
      <Slot.Pressable className={classes} disabled={isDisabled} {...props}>
        {children}
      </Slot.Pressable>
    );
  }

  const spinnerColor =
    variant === "outline" || variant === "ghost" || variant === "link"
      ? tokens.foreground
      : tokens.brandForeground;

  return (
    <Pressable className={classes} disabled={isDisabled} accessibilityRole="button" {...props}>
      {loading ? <ActivityIndicator size="small" color={spinnerColor} /> : null}
      {typeof children === "string" ? (
        <Text className={cn(buttonTextVariants({ variant, size }))}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}
