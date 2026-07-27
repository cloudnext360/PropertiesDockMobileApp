import { z } from "zod";

// Mirrors the backend Notification model (prisma schema `Notification`). The
// recipient fields are omitted — the API already scopes rows to the caller.
export const NotificationTypeSchema = z.enum([
  "SYSTEM",
  "AGENCY_SIGNUP",
  "PAYMENT",
  "PROPERTY",
  "INQUIRY",
  "LEAD",
]);

export const NotificationSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  // In-app deep link (e.g. "/chat/<id>"); chat rows use type SYSTEM + this link.
  link: z.string().nullable().optional(),
  isRead: z.boolean(),
  type: NotificationTypeSchema.catch("SYSTEM"),
  createdAt: z.string(),
});

export type AppNotification = z.infer<typeof NotificationSchema>;
export type AppNotificationType = z.infer<typeof NotificationTypeSchema>;
