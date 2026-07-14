import { apiGet, apiPost } from "@/lib/api";
import { resolveImageUrl } from "@/lib/utils";
import type { ApiEnvelope, NestedPaginatedEnvelope } from "@/types/api";

import {
  ConversationSchema,
  MessageSchema,
  MessagesPageSchema,
  type Conversation,
  type Message,
  type MessagesPage,
} from "./schemas";

const BASE = "/api/chat";

/** Prefix relative `/uploads/...` avatar + property image paths with the API host. */
function normalizeConversation(c: Conversation): Conversation {
  return {
    ...c,
    otherParticipant: c.otherParticipant
      ? {
          ...c.otherParticipant,
          avatarUrl: c.otherParticipant.avatarUrl
            ? resolveImageUrl(c.otherParticipant.avatarUrl)
            : null,
        }
      : null,
    property: c.property
      ? { ...c.property, image: c.property.image ? resolveImageUrl(c.property.image) : null }
      : null,
  };
}

export async function fetchConversations(limit = 50): Promise<Conversation[]> {
  const res = await apiGet<NestedPaginatedEnvelope<unknown>>(
    `${BASE}/conversations?limit=${limit}`,
  );
  const items = res.data?.items ?? [];
  return items.map((raw) => normalizeConversation(ConversationSchema.parse(raw)));
}

export async function fetchMessages(
  conversationId: string,
  cursor?: string,
  limit = 30,
): Promise<MessagesPage> {
  const qs = new URLSearchParams({ limit: String(limit) });
  if (cursor) qs.set("cursor", cursor);
  const res = await apiGet<ApiEnvelope<unknown>>(
    `${BASE}/conversations/${conversationId}/messages?${qs.toString()}`,
  );
  return MessagesPageSchema.parse(res.data);
}

export async function createConversation(
  recipientId: string,
  propertyId?: string,
): Promise<Conversation> {
  const res = await apiPost<ApiEnvelope<unknown>>(`${BASE}/conversations`, {
    recipientId,
    ...(propertyId ? { propertyId } : {}),
  });
  return normalizeConversation(ConversationSchema.parse(res.data));
}

export async function postMessage(conversationId: string, body: string): Promise<Message> {
  const res = await apiPost<ApiEnvelope<unknown>>(
    `${BASE}/conversations/${conversationId}/messages`,
    { body },
  );
  return MessageSchema.parse(res.data);
}

export async function markConversationRead(conversationId: string): Promise<void> {
  await apiPost(`${BASE}/conversations/${conversationId}/read`, {});
}

export async function fetchUnreadCount(): Promise<number> {
  const res = await apiGet<ApiEnvelope<{ count: number }>>(`${BASE}/unread-count`);
  return res.data?.count ?? 0;
}
