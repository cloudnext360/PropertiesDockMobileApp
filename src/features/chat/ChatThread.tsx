import { FlashList } from "@shopify/flash-list";
import { useIsFocused } from "@react-navigation/native";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import { Building2, ChevronLeft } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { KeyboardAvoidingView } from "@/components/keyboard-avoiding-view";
import { Avatar, AvatarFallback, AvatarImage, Button, Text } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { setActiveConversation } from "@/features/notifications/push";
import { useThemeTokens } from "@/theme/theme-provider";

import { useTypingIndicator } from "./ChatSocketProvider";
import { Composer } from "./Composer";
import { formatDayLabel, isSameDay } from "./format";
import { newClientId, useConversations, useMarkRead, useMessages, useSendMessage } from "./hooks";
import { MessageBubble } from "./MessageBubble";
import type { ChatMessage } from "./schemas";
import { TypingIndicator } from "./TypingIndicator";

// Messages within this window from the same sender render as one grouped stack.
const GROUP_WINDOW_MS = 5 * 60 * 1000;

type Row =
  | { type: "day"; id: string; label: string }
  | {
      type: "msg";
      id: string;
      message: ChatMessage;
      isMine: boolean;
      groupedWithOlder: boolean;
      groupedWithNewer: boolean;
      showTimestamp: boolean;
    };

function initialsOf(firstName?: string, lastName?: string): string {
  return ((firstName?.trim()?.[0] ?? "") + (lastName?.trim()?.[0] ?? "")).toUpperCase() || "?";
}

export function ChatThread({ id }: { id: string }) {
  const insets = useSafeAreaInsets();
  const tokens = useThemeTokens();
  const router = useRouter();
  const { user } = useAuth();
  const myId = user?.userId;
  const isFocused = useIsFocused();

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useMessages(id);
  const { data: conversations } = useConversations({ focused: false });
  const sendMessage = useSendMessage(id);
  const markRead = useMarkRead(id);
  const { isPartnerTyping, notifyTyping, stopTyping } = useTypingIndicator(id);

  const conversation = conversations?.find((c) => c.id === id);
  const other = conversation?.otherParticipant;
  const title = other ? `${other.firstName} ${other.lastName}`.trim() : "Conversation";
  const property = conversation?.property ?? null;

  const messages = useMemo(
    () => (data?.pages.flatMap((p) => p.items) ?? []) as ChatMessage[],
    [data],
  );

  // Build render rows in chronological order (oldest→newest). FlashList v2 has no
  // `inverted`; instead the list renders normally and pins to the bottom via
  // maintainVisibleContentPosition, so index 0 (oldest) sits at the top and the
  // newest message sits at the bottom. Day separators land above each day's block.
  const rows = useMemo<Row[]>(() => {
    const chron = messages.slice().reverse();
    const out: Row[] = [];
    for (let j = 0; j < chron.length; j++) {
      const cur = chron[j];
      const prev = chron[j - 1];
      const next = chron[j + 1];
      const curTime = new Date(cur.createdAt).getTime();

      const sameDayAsPrev = !!prev && isSameDay(prev.createdAt, cur.createdAt);
      if (!sameDayAsPrev) out.push({ type: "day", id: `day-${cur.id}`, label: formatDayLabel(cur.createdAt) });

      const groupedWithOlder =
        sameDayAsPrev &&
        prev.senderId === cur.senderId &&
        curTime - new Date(prev.createdAt).getTime() <= GROUP_WINDOW_MS;

      const groupedWithNewer =
        !!next &&
        isSameDay(cur.createdAt, next.createdAt) &&
        next.senderId === cur.senderId &&
        new Date(next.createdAt).getTime() - curTime <= GROUP_WINDOW_MS;

      out.push({
        type: "msg",
        id: cur.id,
        message: cur,
        isMine: cur.senderId === myId,
        groupedWithOlder,
        groupedWithNewer,
        showTimestamp: !groupedWithNewer,
      });
    }
    return out;
  }, [messages, myId]);

  // Mark read on focus and whenever the newest message from the other side lands.
  const markReadRef = useRef(markRead);
  markReadRef.current = markRead;
  useFocusEffect(
    useCallback(() => {
      markReadRef.current.mutate();
      // Suppress foreground chat banners for the thread we're viewing.
      setActiveConversation(id);
      return () => setActiveConversation(null);
    }, [id]),
  );
  const newest = messages[0];
  const newestId = newest?.id;
  const newestSenderId = newest?.senderId;
  const newestIsOptimistic = !!newest?.clientId;
  useEffect(() => {
    if (!isFocused || !newestId) return;
    // A fresh message from the other side while we're looking → mark read.
    if (newestSenderId !== myId && !newestIsOptimistic) markReadRef.current.mutate();
  }, [isFocused, newestId, newestSenderId, newestIsOptimistic, myId]);

  const handleSend = useCallback(
    (body: string) => {
      stopTyping();
      sendMessage.mutate({ body, clientId: newClientId() });
    },
    [sendMessage, stopTyping],
  );

  const handleRetry = useCallback(
    (m: ChatMessage) => {
      if (!m.clientId) return;
      sendMessage.mutate({ body: m.body, clientId: m.clientId });
    },
    [sendMessage],
  );

  const loadOlder = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderRow = useCallback(
    ({ item }: { item: Row }) => {
      if (item.type === "day") {
        return (
          <View className="items-center py-3">
            <View className="rounded-full bg-muted px-3 py-1">
              <Text className="text-[11px] font-jakarta-medium text-muted-foreground">
                {item.label}
              </Text>
            </View>
          </View>
        );
      }
      return (
        <MessageBubble
          message={item.message}
          isMine={item.isMine}
          groupedWithOlder={item.groupedWithOlder}
          groupedWithNewer={item.groupedWithNewer}
          showTimestamp={item.showTimestamp}
          onRetry={handleRetry}
        />
      );
    },
    [handleRetry],
  );

  return (
    <View className="flex-1 bg-white dark:bg-background">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top }}
        className="border-b border-border bg-card"
      >
        <View className="flex-row items-center gap-2 px-2 pb-2">
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Back"
            className="h-10 w-10 items-center justify-center rounded-full active:bg-muted"
          >
            <ChevronLeft size={24} color={tokens.foreground} />
          </Pressable>
          <Avatar alt={title} className="h-9 w-9">
            {other?.avatarUrl ? <AvatarImage source={{ uri: other.avatarUrl }} /> : null}
            <AvatarFallback>
              <Text className="text-xs font-jakarta-bold text-muted-foreground">
                {initialsOf(other?.firstName, other?.lastName)}
              </Text>
            </AvatarFallback>
          </Avatar>
          <Text numberOfLines={1} className="flex-1 font-jakarta-bold text-foreground">
            {title}
          </Text>
        </View>

        {property ? (
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/property/[slug]",
                params: { slug: property.slug },
              } as unknown as Href)
            }
            className="flex-row items-center gap-1.5 border-t border-border px-3 py-1.5 active:bg-muted"
          >
            <Building2 size={13} color={tokens.mutedForeground} />
            <Text numberOfLines={1} className="flex-1 text-xs text-muted-foreground">
              {property.propertyName}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <KeyboardAvoidingView className="flex-1" behavior="padding">
        <View className="flex-1">
          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color={tokens.brand} />
            </View>
          ) : isError ? (
            <View className="flex-1 items-center justify-center gap-3 px-8">
              <Text className="text-center text-sm text-muted-foreground">
                Couldn&apos;t load this conversation.
              </Text>
              <Button variant="brand" size="sm" onPress={() => refetch()}>
                Retry
              </Button>
            </View>
          ) : messages.length === 0 ? (
            <View className="flex-1 items-center justify-center gap-2 px-10">
              <Text className="text-center font-jakarta-bold text-foreground">
                Say hello 👋
              </Text>
              <Text className="text-center text-sm text-muted-foreground">
                {other ? `Start the conversation with ${other.firstName}.` : "Start the conversation."}
              </Text>
            </View>
          ) : (
            <FlashList
              data={rows}
              keyExtractor={(r) => r.id}
              renderItem={renderRow}
              maintainVisibleContentPosition={{
                startRenderingFromBottom: true,
                autoscrollToBottomThreshold: 0.2,
              }}
              onStartReached={loadOlder}
              onStartReachedThreshold={0.3}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingVertical: 8 }}
              ListHeaderComponent={
                isFetchingNextPage ? (
                  <View className="py-3">
                    <ActivityIndicator size="small" color={tokens.mutedForeground} />
                  </View>
                ) : null
              }
            />
          )}
        </View>

        {isPartnerTyping ? <TypingIndicator /> : null}

        <View style={{ paddingBottom: Math.max(insets.bottom, 6) }} className="bg-card">
          <Composer onSend={handleSend} onTyping={notifyTyping} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
