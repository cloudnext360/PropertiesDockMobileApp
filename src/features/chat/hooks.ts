import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";

import { useAuth } from "@/context/AuthContext";
import { queryKeys } from "@/lib/query-keys";

import {
  createConversation,
  fetchConversations,
  fetchMessages,
  fetchUnreadCount,
  markConversationRead,
  postMessage,
} from "./api";
import type { ChatMessage, Conversation, MessagesPage } from "./schemas";

// With the socket layer live, realtime events drive updates and the socket
// refetches on (re)connect. Polling is now just a slow safety net for missed
// events; messages don't poll at all (the open thread gets message:new).
const CONVERSATIONS_POLL_MS = 60_000;
const UNREAD_POLL_MS = 30_000;

type MessagesCache = InfiniteData<MessagesPage, string | undefined>;
type FocusOptions = { focused?: boolean };

/** Stable client id for an optimistic message; reused across retries. */
export function newClientId(): string {
  return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function isPending(m: ChatMessage): boolean {
  return !!m.clientId && m.status !== "sent";
}

// ── Queries ─────────────────────────────────────────────────────────────────

/**
 * My conversation list, newest activity first. Realtime keeps it fresh; this
 * polls only as a slow 60s safety net while `focused` (default true). Pass
 * `{ focused: false }` to pause the fallback while keeping the cached list.
 */
export function useConversations({ focused = true }: FocusOptions = {}) {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.chatConversations(),
    queryFn: () => fetchConversations(),
    enabled: !!user,
    refetchInterval: focused ? CONVERSATIONS_POLL_MS : false,
  });
}

/**
 * Cursor-paginated messages for a conversation (newest first). No polling — the
 * socket delivers `message:new` while the thread is open, and a reconnect
 * refetches. Still preserves local optimistic messages (sending/failed) across
 * any refetch so a failed send stays visible and retriable.
 */
export function useMessages(conversationId: string) {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useInfiniteQuery({
    queryKey: queryKeys.chatMessages(conversationId),
    initialPageParam: undefined as string | undefined,
    enabled: !!user && !!conversationId,
    queryFn: async ({ pageParam }) => {
      const page = await fetchMessages(conversationId, pageParam);

      // Only the first (newest) page reconciles with in-flight/failed sends.
      if (pageParam === undefined) {
        const existing = qc.getQueryData<MessagesCache>(queryKeys.chatMessages(conversationId));
        const pending = (existing?.pages?.[0]?.items ?? []).filter((m) =>
          isPending(m as ChatMessage),
        ) as ChatMessage[];
        if (pending.length) {
          const serverIds = new Set(page.items.map((m) => m.id));
          const stillPending = pending.filter((m) => !serverIds.has(m.id));
          return { ...page, items: [...stillPending, ...page.items] };
        }
      }
      return page;
    },
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}

/** Total unread across all conversations — drives the Chat tab badge. Always polls. */
export function useUnreadCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.chatUnreadCount(),
    queryFn: fetchUnreadCount,
    enabled: !!user,
    refetchInterval: UNREAD_POLL_MS,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/** Moves a conversation to the top of the list cache and refreshes its preview. */
function bumpConversation(
  list: Conversation[],
  conversationId: string,
  preview: string,
  at: string,
): Conversation[] {
  const idx = list.findIndex((c) => c.id === conversationId);
  if (idx === -1) return list;
  const updated: Conversation = { ...list[idx], lastMessagePreview: preview, lastMessageAt: at };
  return [updated, ...list.slice(0, idx), ...list.slice(idx + 1)];
}

function patchMessage(
  cache: MessagesCache | undefined,
  clientId: string,
  patch: (m: ChatMessage) => ChatMessage,
): MessagesCache | undefined {
  if (!cache) return cache;
  return {
    ...cache,
    pages: cache.pages.map((p) => ({
      ...p,
      items: p.items.map((m) =>
        (m as ChatMessage).clientId === clientId ? patch(m as ChatMessage) : m,
      ),
    })),
  };
}

type SendVars = { body: string; clientId: string };

/**
 * Optimistic send. Pass a `clientId` (from `newClientId()`); reuse the same id
 * to retry a failed message so it updates in place instead of duplicating.
 */
export function useSendMessage(conversationId: string) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const key = queryKeys.chatMessages(conversationId);

  return useMutation({
    mutationFn: ({ body }: SendVars) => postMessage(conversationId, body),

    onMutate: async ({ body, clientId }) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<MessagesCache>(key);

      const optimistic: ChatMessage = {
        id: clientId,
        clientId,
        conversationId,
        senderId: user?.userId ?? "me",
        body,
        imageUrl: null,
        createdAt: new Date().toISOString(),
        status: "sending",
      };

      qc.setQueryData<MessagesCache>(key, (old) => {
        if (!old) {
          return {
            pages: [{ items: [optimistic], nextCursor: null }],
            pageParams: [undefined],
          };
        }
        const exists = old.pages.some((p) =>
          p.items.some((m) => (m as ChatMessage).clientId === clientId),
        );
        return {
          ...old,
          pages: old.pages.map((p, i) => {
            if (exists) {
              return {
                ...p,
                items: p.items.map((m) =>
                  (m as ChatMessage).clientId === clientId ? optimistic : m,
                ),
              };
            }
            return i === 0 ? { ...p, items: [optimistic, ...p.items] } : p;
          }),
        };
      });

      qc.setQueryData<Conversation[]>(queryKeys.chatConversations(), (old) =>
        old ? bumpConversation(old, conversationId, body, optimistic.createdAt) : old,
      );

      return { previous, clientId };
    },

    onSuccess: (serverMessage, _vars, ctx) => {
      // Replace the optimistic row with the server row (drops clientId → no longer "pending").
      qc.setQueryData<MessagesCache>(key, (old) =>
        patchMessage(old, ctx.clientId, () => ({ ...serverMessage, status: "sent" })),
      );
      qc.invalidateQueries({ queryKey: queryKeys.chatUnreadCount() });
    },

    onError: (_err, _vars, ctx) => {
      // Keep the message but flag it failed so the UI can offer a retry.
      if (!ctx) return;
      qc.setQueryData<MessagesCache>(key, (old) =>
        patchMessage(old, ctx.clientId, (m) => ({ ...m, status: "failed" })),
      );
    },
  });
}

/** Marks a conversation read: zeroes its unread in the list cache + refreshes the badge. */
export function useMarkRead(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => markConversationRead(conversationId),
    onSuccess: () => {
      qc.setQueryData<Conversation[]>(queryKeys.chatConversations(), (old) =>
        old ? old.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)) : old,
      );
      qc.invalidateQueries({ queryKey: queryKeys.chatUnreadCount() });
    },
  });
}

/**
 * Get-or-create a conversation with a recipient (optionally about a property).
 * Seeds the list cache so the new conversation is present before navigation.
 */
export function useStartConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ recipientId, propertyId }: { recipientId: string; propertyId?: string }) =>
      createConversation(recipientId, propertyId),
    onSuccess: (conversation) => {
      qc.setQueryData<Conversation[]>(queryKeys.chatConversations(), (old) => {
        if (!old) return [conversation];
        return old.some((c) => c.id === conversation.id)
          ? old.map((c) => (c.id === conversation.id ? conversation : c))
          : [conversation, ...old];
      });
    },
  });
}
