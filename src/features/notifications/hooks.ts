import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/context/AuthContext";
import { queryKeys } from "@/lib/query-keys";

import {
  fetchNotifications,
  fetchNotificationUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "./api";
import type { AppNotification } from "./schemas";

// Poll the unread count so the bell's dot appears without opening the panel.
const UNREAD_POLL_MS = 30_000;

/**
 * Recent notifications for the bell panel. Disabled until the panel opens
 * (`enabled`) so we don't fetch the full list on every home render — the dot is
 * driven by the cheaper unread-count query instead.
 */
export function useNotifications({ enabled = true }: { enabled?: boolean } = {}) {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.notifications(),
    queryFn: () => fetchNotifications(),
    enabled: !!user && enabled,
  });
}

/** Unread total — drives the bell's red dot. Polls while signed in. */
export function useNotificationUnreadCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.notificationsUnreadCount(),
    queryFn: fetchNotificationUnreadCount,
    enabled: !!user,
    refetchInterval: UNREAD_POLL_MS,
  });
}

/**
 * Marks one notification read. Optimistically flips `isRead` in the list cache
 * (the panel filters those out, so the row disappears) and decrements the dot.
 */
export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.notifications() });
      const previousList = qc.getQueryData<AppNotification[]>(queryKeys.notifications());
      const previousCount = qc.getQueryData<number>(queryKeys.notificationsUnreadCount());

      // Only decrement the dot if the row was actually unread (avoid double-count).
      const wasUnread = previousList?.some((n) => n.id === id && !n.isRead) ?? false;

      qc.setQueryData<AppNotification[]>(queryKeys.notifications(), (old) =>
        old ? old.map((n) => (n.id === id ? { ...n, isRead: true } : n)) : old,
      );
      if (wasUnread) {
        qc.setQueryData<number>(queryKeys.notificationsUnreadCount(), (c) =>
          typeof c === "number" ? Math.max(0, c - 1) : c,
        );
      }
      return { previousList, previousCount };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.previousList) qc.setQueryData(queryKeys.notifications(), ctx.previousList);
      if (ctx?.previousCount !== undefined)
        qc.setQueryData(queryKeys.notificationsUnreadCount(), ctx.previousCount);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notificationsUnreadCount() });
    },
  });
}

/** Clears everything at once (the "Mark all as read" action). */
export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: queryKeys.notifications() });
      const previousList = qc.getQueryData<AppNotification[]>(queryKeys.notifications());
      const previousCount = qc.getQueryData<number>(queryKeys.notificationsUnreadCount());
      qc.setQueryData<AppNotification[]>(queryKeys.notifications(), (old) =>
        old ? old.map((n) => ({ ...n, isRead: true })) : old,
      );
      qc.setQueryData<number>(queryKeys.notificationsUnreadCount(), 0);
      return { previousList, previousCount };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previousList) qc.setQueryData(queryKeys.notifications(), ctx.previousList);
      if (ctx?.previousCount !== undefined)
        qc.setQueryData(queryKeys.notificationsUnreadCount(), ctx.previousCount);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notificationsUnreadCount() });
    },
  });
}
