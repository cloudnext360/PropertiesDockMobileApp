import { Send } from "lucide-react-native";
import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";

import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";
import { useThemeTokens } from "@/theme/theme-provider";

/**
 * Message composer: auto-growing multiline input (grows to ~5 lines then
 * scrolls) + a send button that's disabled until there's non-whitespace text.
 * Calls `onTyping` on each edit so the parent can drive typing indicators.
 */
export function Composer({
  onSend,
  onTyping,
}: {
  onSend: (body: string) => void;
  onTyping: () => void;
}) {
  const tokens = useThemeTokens();
  const [text, setText] = useState("");
  const canSend = text.trim().length > 0;

  const submit = () => {
    const body = text.trim();
    if (!body) return;
    haptics.light();
    setText("");
    onSend(body);
  };

  return (
    <View className="flex-row items-end gap-2 border-t border-border bg-card px-3 py-2">
      <View className="flex-1 justify-center rounded-2xl bg-muted px-3.5 py-1">
        <TextInput
          value={text}
          onChangeText={(t) => {
            setText(t);
            onTyping();
          }}
          placeholder="Message…"
          placeholderTextColor={tokens.mutedForeground}
          multiline
          style={{ maxHeight: 120, color: tokens.foreground, fontFamily: "PlusJakartaSans_400Regular" }}
          className="py-2 text-[15px]"
        />
      </View>

      <Pressable
        onPress={submit}
        disabled={!canSend}
        accessibilityRole="button"
        accessibilityLabel="Send message"
        className={cn(
          "h-11 w-11 items-center justify-center rounded-full",
          canSend ? "bg-brand active:opacity-80" : "bg-muted",
        )}
      >
        <Send size={20} color={canSend ? tokens.brandForeground : tokens.mutedForeground} />
      </Pressable>
    </View>
  );
}
