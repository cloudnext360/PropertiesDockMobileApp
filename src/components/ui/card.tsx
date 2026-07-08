import { View, type ViewProps } from "react-native";

import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: ViewProps) {
  return (
    <View
      className={cn("rounded-lg border border-border bg-card shadow-sm", className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: ViewProps) {
  return <View className={cn("gap-1.5 p-4", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.ComponentProps<typeof Text>) {
  return (
    <Text
      className={cn("text-lg font-jakarta-semibold text-card-foreground", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: React.ComponentProps<typeof Text>) {
  return <Text className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export function CardContent({ className, ...props }: ViewProps) {
  return <View className={cn("p-4 pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }: ViewProps) {
  return <View className={cn("flex-row items-center p-4 pt-0", className)} {...props} />;
}
