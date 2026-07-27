import { apiGet, apiPatch } from "@/lib/api";
import type { ApiEnvelope, NestedPaginatedEnvelope } from "@/types/api";

import { NotificationSchema, type AppNotification } from "./schemas";

const BASE = "/api/notifications";

/** Recent notifications, newest first (backend returns them paginated in `data.items`). */
export async function fetchNotifications(limit = 30): Promise<AppNotification[]> {
  const res = await apiGet<NestedPaginatedEnvelope<unknown>>(`${BASE}?limit=${limit}`);
  const items = res.data?.items ?? [];
  return items.map((raw) => NotificationSchema.parse(raw));
}

/** Server-side unread total — the source of truth for the bell's red dot. */
export async function fetchNotificationUnreadCount(): Promise<number> {
  const res = await apiGet<ApiEnvelope<{ count: number }>>(`${BASE}/unread-count`);
  return res.data?.count ?? 0;
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiPatch(`${BASE}/${id}/read`, {});
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiPatch(`${BASE}/mark-all-read`, {});
}
