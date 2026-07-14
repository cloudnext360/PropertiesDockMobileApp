import { FlashList } from "@shopify/flash-list";
import { useIsFocused } from "@react-navigation/native";
import { useRouter, type Href } from "expo-router";
import { MessageCircle } from "lucide-react-native";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Skeleton, Text } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { ConversationRow } from "@/features/chat/ConversationRow";
import { useConversations } from "@/features/chat/hooks";
import type { Conversation } from "@/features/chat/schemas";
import { useThemeTokens } from "@/theme/theme-provider";

/**
 * Chats tab: the conversation list. Header + empty state are preserved from the
 * original placeholder; the list, loading skeletons, and error state replace the
 * body once data flows.
 */
export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const isFocused = useIsFocused();

  const { data, isLoading, isError, refetch, isRefetching } = useConversations({
    focused: isFocused,
  });

  const openConversation = (c: Conversation) =>
    router.push({ pathname: "/chat/[id]", params: { id: c.id } } as unknown as Href);

  return (
    <View className="flex-1 bg-white dark:bg-background">
      <View style={{ paddingTop: insets.top }} className="px-4">
        <View className="h-14 justify-center">
          <Text className="text-2xl font-jakarta-extrabold text-foreground">Chats</Text>
        </View>
      </View>

      <Body
        user={user}
        data={data}
        isLoading={isLoading}
        isError={isError}
        isRefetching={isRefetching}
        onRetry={() => refetch()}
        onOpen={openConversation}
        onSignIn={() => router.push("/auth")}
      />
    </View>
  );
}

type BodyProps = {
  user: ReturnType<typeof useAuth>["user"];
  data: Conversation[] | undefined;
  isLoading: boolean;
  isError: boolean;
  isRefetching: boolean;
  onRetry: () => void;
  onOpen: (c: Conversation) => void;
  onSignIn: () => void;
};

function EmptyState() {
  const tokens = useThemeTokens();
  return (
    <View className="flex-1 items-center justify-center gap-3 px-10">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-brand/10">
        <MessageCircle size={28} color={tokens.brand} />
      </View>
      <Text className="text-center font-jakarta-bold text-foreground">No messages yet</Text>
      <Text className="text-center text-sm text-muted-foreground">
        Chat with agents and buyers about listings. Your conversations will appear here.
      </Text>
    </View>
  );
}

function Body({
  user,
  data,
  isLoading,
  isError,
  isRefetching,
  onRetry,
  onOpen,
  onSignIn,
}: BodyProps) {
  if (!user) {
    return (
      <View className="flex-1 items-center justify-center gap-3 px-8">
        <Text className="text-center text-muted-foreground">
          Sign in to see your conversations.
        </Text>
        <Button variant="brand" size="sm" onPress={onSignIn}>
          Sign in
        </Button>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="gap-3 p-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} className="flex-row items-center gap-3">
            <Skeleton className="h-14 w-14 rounded-full" />
            <View className="flex-1 gap-2">
              <Skeleton className="h-4 w-1/2 rounded" />
              <Skeleton className="h-3 w-3/4 rounded" />
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center gap-3 px-8">
        <Text className="text-center font-jakarta-semibold text-foreground">
          Couldn&apos;t load your chats
        </Text>
        <Text className="text-center text-sm text-muted-foreground">
          Check your connection and try again.
        </Text>
        <Button variant="brand" size="sm" onPress={onRetry}>
          Retry
        </Button>
      </View>
    );
  }

  const items = data ?? [];
  if (items.length === 0) return <EmptyState />;

  return (
    <FlashList
      data={items}
      keyExtractor={(c) => c.id}
      renderItem={({ item }) => <ConversationRow conversation={item} onPress={onOpen} />}
      onRefresh={onRetry}
      refreshing={isRefetching}
      contentContainerStyle={{ paddingVertical: 4 }}
    />
  );
}
