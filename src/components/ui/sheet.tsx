import * as DialogPrimitive from "@rn-primitives/dialog";
import { KeyboardAvoidingView, Platform, StyleSheet, View, type ViewProps } from "react-native";

import { MotiView } from "@/components/ui/moti";
import { cn } from "@/lib/utils";

// A bottom sheet built on the dialog primitive (same open/close semantics).
export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

export function SheetContent({
  className,
  children,
  portalHost,
  ...props
}: DialogPrimitive.ContentProps & { portalHost?: string }) {
  return (
    <DialogPrimitive.Portal hostName={portalHost}>
      <DialogPrimitive.Overlay style={StyleSheet.absoluteFill} className="justify-end bg-black/50">
        {/* Keyboard avoidance must wrap the bottom-anchored card itself — padding
            applied inside the card can't move it. Android resizes the window
            instead (softwareKeyboardLayoutMode "resize"), so no behavior there. */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.avoid}
        >
          <MotiView
            from={{ translateY: 500 }}
            animate={{ translateY: 0 }}
            transition={{ type: "timing", duration: 220 }}
            style={styles.shrink}
          >
            <DialogPrimitive.Content
              style={styles.shrink}
              className={cn(
                "rounded-t-2xl border border-border bg-card p-6 pb-10",
                className,
              )}
              {...props}
            >
              <View className="mb-4 h-1.5 w-12 self-center rounded-full bg-muted" />
              {children}
            </DialogPrimitive.Content>
          </MotiView>
        </KeyboardAvoidingView>
      </DialogPrimitive.Overlay>
    </DialogPrimitive.Portal>
  );
}

// Cap the sheet at the visible area and let every layer shrink, so that when the
// keyboard halves the available height, scrollable content inside the sheet
// compresses (and scrolls) instead of being pushed off-screen.
const styles = StyleSheet.create({
  avoid: { maxHeight: "100%" },
  shrink: { flexShrink: 1 },
});

export function SheetHeader({ className, ...props }: ViewProps) {
  return <View className={cn("gap-1.5", className)} {...props} />;
}

export function SheetTitle({ className, ...props }: DialogPrimitive.TitleProps) {
  return (
    <DialogPrimitive.Title
      className={cn("text-lg font-jakarta-semibold text-card-foreground", className)}
      {...props}
    />
  );
}

export function SheetDescription({ className, ...props }: DialogPrimitive.DescriptionProps) {
  return (
    <DialogPrimitive.Description
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}
