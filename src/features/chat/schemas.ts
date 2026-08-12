import { z } from "zod";

/**
 * Response shapes for the backend chat module (propertydockbackendnew
 * src/modules/chat). Dates arrive as ISO strings over JSON. Note the linked
 * property uses `propertyName` (the DB column), not `title`.
 */

export const ChatParticipantSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  avatarUrl: z.string().nullable(),
});

export const ChatPropertyRefSchema = z.object({
  id: z.string(),
  propertyName: z.string(),
  slug: z.string(),
  // Optional so a backend that predates the field doesn't fail validation —
  // propertyAvailability() treats a missing status as available.
  status: z.string().optional(),
  price: z.number(),
  currency: z.string(),
  listingType: z.enum(["SALE", "RENT"]),
  image: z.string().nullable(),
});

export const ConversationSchema = z.object({
  id: z.string(),
  propertyId: z.string().nullable(),
  lastMessageAt: z.string(),
  lastMessagePreview: z.string().nullable(),
  unreadCount: z.number(),
  // The other participant's receipt timestamps — drive my message ticks.
  // Nullish for tolerance if an older backend omits them.
  otherDeliveredAt: z.string().nullish(),
  otherReadAt: z.string().nullish(),
  otherParticipant: ChatParticipantSchema.nullable(),
  property: ChatPropertyRefSchema.nullable(),
});

export const MessageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  senderId: z.string(),
  body: z.string(),
  imageUrl: z.string().nullable(),
  createdAt: z.string(),
});

export const MessagesPageSchema = z.object({
  items: z.array(MessageSchema),
  nextCursor: z.string().nullable(),
});

export type ChatParticipant = z.infer<typeof ChatParticipantSchema>;
export type ChatPropertyRef = z.infer<typeof ChatPropertyRefSchema>;
export type Conversation = z.infer<typeof ConversationSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type MessagesPage = z.infer<typeof MessagesPageSchema>;

/** Client-side delivery state for optimistic messages (never sent by the server). */
export type MessageStatus = "sending" | "sent" | "failed";

/**
 * Read-receipt state for one of MY sent messages, derived from the other
 * participant's timestamps: "sent" (single tick) → "delivered" (double tick) →
 * "read" (green double tick).
 */
export type MessageReceipt = "sent" | "delivered" | "read";

/**
 * A message as held in the cache: a server `Message`, optionally augmented with
 * an optimistic `clientId` + `status` while a send is in flight or has failed.
 */
export type ChatMessage = Message & {
  clientId?: string;
  status?: MessageStatus;
};
