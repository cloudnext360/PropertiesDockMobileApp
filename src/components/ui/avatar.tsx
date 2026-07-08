import * as AvatarPrimitive from "@rn-primitives/avatar";

import { cn } from "@/lib/utils";

export function Avatar({ className, ...props }: AvatarPrimitive.RootProps) {
  return (
    <AvatarPrimitive.Root
      className={cn(
        "h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-muted",
        className,
      )}
      {...props}
    />
  );
}

export function AvatarImage({ className, ...props }: AvatarPrimitive.ImageProps) {
  return <AvatarPrimitive.Image className={cn("h-full w-full", className)} {...props} />;
}

export function AvatarFallback({ className, ...props }: AvatarPrimitive.FallbackProps) {
  return (
    <AvatarPrimitive.Fallback
      className={cn("h-full w-full items-center justify-center bg-muted", className)}
      {...props}
    />
  );
}
