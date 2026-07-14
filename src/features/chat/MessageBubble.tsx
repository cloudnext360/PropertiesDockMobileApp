import { AlertCircle } from "lucide-react-native";
import { memo } from "react";
import { Pressable, View } from "react-native";

import { Text } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useThemeTokens } from "@/theme/theme-provider";

import { formatMessageTime } from "./format";
import type { ChatMessage } from "./schemas";

export type BubbleProps = {
  message: ChatMessage;
  isMine: boolean;
  groupedWithOlder: boolean;
  groupedWithNewer: boolean;
  showTimestamp: boolean;
  onRetry: (message: ChatMessage) => void;
};

export const MessageBubble = memo(function MessageBubble({
  message,
  isMine,
  groupedWithOlder,
  groupedWithNewer,
  showTimestamp,
  onRetry,
}: BubbleProps) {
  const tokens = useThemeTokens();
  const failed = message.status === "failed";
  const sending = message.status === "sending";

  // Tighten the corner facing an adjacent same-sender bubble so a run reads as
  // one grouped stack.
  const corner = cn(
    isMine ? "rounded-2xl" : "rounded-2xl",
    isMine && groupedWithOlder && "rounded-tr-md",
    isMine && groupedWithNewer && "rounded-br-md",
    !isMine && groupedWithOlder && "rounded-tl-md",
    !isMine && groupedWithNewer && "rounded-bl-md",
  );

  const bubble = (
    <View
      className={cn(
        "max-w-[80%] px-3.5 py-2",
        corner,
        isMine ? "bg-brand" : "bg-muted",
        sending && "opacity-70",
        failed && "border border-destructive",
      )}
    >
      <Text className={cn("text-[15px]", isMine ? "text-brand-foreground" : "text-foreground")}>
        {message.body}
      </Text>
    </View>
  );

  return (
    <View
      className={cn(
        "px-4",
        groupedWithOlder ? "mt-0.5" : "mt-3",
        isMine ? "items-end" : "items-start",
      )}
    >
      {failed ? (
        <Pressable onPress={() => onRetry(message)} accessibilityLabel="Retry sending message">
          {bubble}
        </Pressable>
      ) : (
        bubble
      )}

      {failed ? (
        <View className="mt-0.5 flex-row items-center gap-1">
          <AlertCircle size={12} color={tokens.destructive} />
          <Text className="text-[11px] text-destructive">Not delivered · Tap to retry</Text>
        </View>
      ) : showTimestamp ? (
        <Text className="mt-0.5 text-[11px] text-muted-foreground">
          {sending ? "Sending…" : formatMessageTime(message.createdAt)}
        </Text>
      ) : null}
    </View>
  );
});
