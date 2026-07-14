import type { InfiniteData } from "@tanstack/react-query";
import { io, type Socket } from "socket.io-client";

import { config } from "@/lib/config";
import { queryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";
import { getAccessToken } from "@/lib/storage";

import type { ChatMessage, Conversation, Message, MessagesPage } from "./schemas";

type MessagesCache = InfiniteData<MessagesPage, string | undefined>;

/** Payload of the backend `conversation:updated` event (config/socket.ts). */
export type ConversationUpdatedPayload = {
  conversationId: string;
  lastMessagePreview: string | null;
  lastMessageAt: string;
  unreadCount: number;
  senderId: string;
};

let socket: Socket | null = null;

export function getChatSocket(): Socket | null {
  return socket;
}

// ── Cache reconciliation (module-level, uses the shared queryClient singleton) ──

/**
 * Merge a message that arrived over the wire into the thread cache. Deduped by
 * server id; also strips a matching optimistic bubble (own send) so the sender
 * never sees their message twice, regardless of whether this event or the POST
 * response lands first.
 */
function upsertIncomingMessage(msg: Message): void {
  const key = queryKeys.chatMessages(msg.conversationId);
  queryClient.setQueryData<MessagesCache>(key, (old) => {
    if (!old) return old; // thread not open → nothing to append to
    const alreadyPresent = old.pages.some((p) => p.items.some((m) => m.id === msg.id));

    const pages = old.pages.map((page, i) => {
      const items = page.items.filter((m) => {
        const cm = m as ChatMessage;
        const isOwnOptimistic =
          !!cm.clientId &&
          cm.status !== "sent" &&
          cm.senderId === msg.senderId &&
          cm.body === msg.body;
        return !isOwnOptimistic;
      });
      // Newest page holds newest messages; prepend if this id is new.
      if (i === 0 && !alreadyPresent) return { ...page, items: [msg as ChatMessage, ...items] };
      return { ...page, items };
    });

    return { ...old, pages };
  });
}

/** Patch the conversation list + tab badge from a `conversation:updated` event. */
function applyConversationUpdated(p: ConversationUpdatedPayload): void {
  const listKey = queryKeys.chatConversations();
  let found = false;

  queryClient.setQueryData<Conversation[]>(listKey, (old) => {
    if (!old) return old;
    const idx = old.findIndex((c) => c.id === p.conversationId);
    if (idx === -1) return old;
    found = true;
    const updated: Conversation = {
      ...old[idx],
      lastMessagePreview: p.lastMessagePreview,
      lastMessageAt: p.lastMessageAt,
      unreadCount: p.unreadCount,
    };
    return [updated, ...old.slice(0, idx), ...old.slice(idx + 1)];
  });

  if (!found) {
    // A brand-new conversation (someone messaged us first) isn't in the list yet.
    queryClient.invalidateQueries({ queryKey: listKey });
    queryClient.invalidateQueries({ queryKey: queryKeys.chatUnreadCount() });
    return;
  }

  const list = queryClient.getQueryData<Conversation[]>(listKey) ?? [];
  const total = list.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);
  queryClient.setQueryData<number>(queryKeys.chatUnreadCount(), total);
}

// ── Connection lifecycle ────────────────────────────────────────────────────

/**
 * Connect (or return the existing) chat socket, authenticated with the given
 * access token. Registers the cache-updating listeners once per instance.
 */
export function connectChatSocket(token: string): Socket {
  if (socket) {
    socket.auth = { token };
    if (!socket.connected) socket.connect();
    return socket;
  }

  socket = io(config.apiUrl, {
    auth: { token },
    transports: ["websocket"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
    timeout: 10000,
  });

  // Any (re)connection: pull fresh chat state so a gap can't leave us stale.
  socket.on("connect", () => {
    queryClient.invalidateQueries({ queryKey: ["chat"] });
  });

  // If the handshake was rejected (likely an expired token), pick up a token
  // that a REST 401-refresh may have rotated into storage, then let it retry.
  socket.on("connect_error", async () => {
    const fresh = await getAccessToken();
    if (fresh && socket) socket.auth = { token: fresh };
  });

  socket.on("message:new", (msg: Message) => upsertIncomingMessage(msg));
  socket.on("conversation:updated", (p: ConversationUpdatedPayload) =>
    applyConversationUpdated(p),
  );

  return socket;
}

/** Tear down the socket entirely (on logout). */
export function disconnectChatSocket(): void {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
}
