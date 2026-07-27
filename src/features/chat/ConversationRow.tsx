import { Building2 } from "lucide-react-native";
import { memo } from "react";
import { Pressable, View } from "react-native";

import { Avatar, AvatarFallback, AvatarImage, Text } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useThemeTokens } from "@/theme/theme-provider";

import { formatConversationTime } from "./format";
import type { Conversation } from "./schemas";

function initialsOf(firstName?: string, lastName?: string): string {
  const a = firstName?.trim()?.[0] ?? "";
  const b = lastName?.trim()?.[0] ?? "";
  return (a + b).toUpperCase() || "?";
}

export const ConversationRow = memo(function ConversationRow({
  conversation,
  onPress,
}: {
  conversation: Conversation;
  onPress: (conversation: Conversation) => void;
}) {
  const tokens = useThemeTokens();
  const other = conversation.otherParticipant;
  const name = other ? `${other.firstName} ${other.lastName}`.trim() : "Unknown";
  const unread = conversation.unreadCount > 0;
  const preview = conversation.lastMessagePreview ?? "No messages yet";
  const time = formatConversationTime(conversation.lastMessageAt);

  return (
    <Pressable
      onPress={() => onPress(conversation)}
      className={cn(
        "flex-row items-center gap-3 px-4 py-3 active:bg-muted/40",
        unread && "bg-brand/5 dark:bg-brand/10",
      )}
      accessibilityRole="button"
      accessibilityLabel={`Chat with ${name}`}
    >
      <Avatar alt={name} className="h-14 w-14">
        {other?.avatarUrl ? <AvatarImage source={{ uri: other.avatarUrl }} /> : null}
        <AvatarFallback>
          <Text className="font-jakarta-bold text-muted-foreground">
            {initialsOf(other?.firstName, other?.lastName)}
          </Text>
        </AvatarFallback>
      </Avatar>

      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center justify-between gap-2">
          <Text
            numberOfLines={1}
            className={cn(
              "flex-1 text-foreground",
              unread ? "font-jakarta-bold" : "font-jakarta-semibold",
            )}
          >
            {name}
          </Text>
          <Text className={cn("text-xs", unread ? "text-brand" : "text-muted-foreground")}>
            {time}
          </Text>
        </View>

        <View className="flex-row items-center justify-between gap-2">
          <Text
            numberOfLines={1}
            className={cn(
              "flex-1 text-sm",
              unread ? "font-jakarta-medium text-foreground" : "text-muted-foreground",
            )}
          >
            {preview}
          </Text>
          {unread ? (
            <View className="h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5">
              <Text className="text-brand-foreground text-[11px] font-jakarta-bold">
                {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
              </Text>
            </View>
          ) : null}
        </View>

        {conversation.property ? (
          <View className="flex-row items-center gap-1">
            <Building2 size={12} color={tokens.mutedForeground} />
            <Text numberOfLines={1} className="flex-1 text-xs text-muted-foreground">
              {conversation.property.propertyName}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
});
