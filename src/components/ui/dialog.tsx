import * as DialogPrimitive from "@rn-primitives/dialog";
import { X } from "lucide-react-native";
import { StyleSheet, View, type ViewProps } from "react-native";

import { MotiView } from "@/components/ui/moti";
import { cn } from "@/lib/utils";
import { useThemeTokens } from "@/theme/theme-provider";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  className,
  children,
  portalHost,
  ...props
}: DialogPrimitive.ContentProps & { portalHost?: string }) {
  const tokens = useThemeTokens();
  return (
    <DialogPrimitive.Portal hostName={portalHost}>
      <DialogPrimitive.Overlay
        style={StyleSheet.absoluteFill}
        className="items-center justify-center bg-black/50 p-6"
      >
        <MotiView
          from={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "timing", duration: 150 }}
          className="w-full max-w-md"
        >
          <DialogPrimitive.Content
            className={cn(
              "rounded-lg border border-border bg-card p-6 shadow-lg",
              className,
            )}
            {...props}
          >
            {children}
            <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm p-1 opacity-70 active:opacity-100">
              <X size={18} color={tokens.mutedForeground} />
            </DialogPrimitive.Close>
          </DialogPrimitive.Content>
        </MotiView>
      </DialogPrimitive.Overlay>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({ className, ...props }: ViewProps) {
  return <View className={cn("gap-1.5 pr-6", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: ViewProps) {
  return <View className={cn("mt-4 flex-row justify-end gap-2", className)} {...props} />;
}

export function DialogTitle({ className, ...props }: DialogPrimitive.TitleProps) {
  return (
    <DialogPrimitive.Title
      className={cn("text-lg font-jakarta-semibold text-card-foreground", className)}
      {...props}
    />
  );
}

export function DialogDescription({ className, ...props }: DialogPrimitive.DescriptionProps) {
  return (
    <DialogPrimitive.Description
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}
