import { ScrollView, View, type ViewProps } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { cn } from "@/lib/utils";

interface ScreenProps extends ViewProps {
  /** Safe-area edges to inset. Defaults to top + bottom. */
  edges?: readonly Edge[];
  /** Wrap children in a vertical ScrollView. */
  scroll?: boolean;
  /** Extra classes on the inner content container. */
  contentClassName?: string;
}

/**
 * Themed screen wrapper: fills the viewport, applies the `background` token,
 * and insets safe areas. Use as the outermost element of every route.
 */
export function Screen({
  edges = ["top", "bottom"],
  scroll = false,
  className,
  contentClassName,
  children,
  ...props
}: ScreenProps) {
  const content = (
    <View className={cn("flex-1", contentClassName)} {...props}>
      {children}
    </View>
  );

  return (
    <SafeAreaView edges={edges} className={cn("flex-1 bg-background", className)}>
      {scroll ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName="grow"
          keyboardShouldPersistTaps="handled"
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}
