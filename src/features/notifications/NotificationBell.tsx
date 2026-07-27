import { useRouter, type Href } from "expo-router";
import {
  Bell,
  Building2,
  CheckCheck,
  CreditCard,
  FileText,
  House,
  MessageSquare,
} from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, useWindowDimensions, View } from "react-native";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Skeleton,
  Text,
} from "@/components/ui";
import { haptics } from "@/lib/haptics";
import { timeAgo } from "@/lib/utils";
import { useThemeTokens } from "@/theme/theme-provider";

import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useNotificationUnreadCount,
} from "./hooks";
import type { AppNotification } from "./schemas";

/** Picks the row icon — chat links (type SYSTEM + "/chat" link) get the bubble. */
function iconFor(n: AppNotification): typeof Bell {
  if (n.link?.startsWith("/chat")) return MessageSquare;
  switch (n.type) {
    case "PROPERTY":
      return House;
    case "INQUIRY":
      return MessageSquare;
    case "LEAD":
      return FileText;
    case "PAYMENT":
      return CreditCard;
    case "AGENCY_SIGNUP":
      return Building2;
    default:
      return Bell;
  }
}

/**
 * Home-header notification bell. Shows a red dot (not a count) while there are
 * unread notifications; tapping opens a bottom sheet listing them. Reading a
 * notification marks it read on the server and removes it from the list.
 */
export function NotificationBell() {
  const router = useRouter();
  const tokens = useThemeTokens();
  const { height } = useWindowDimensions();

  const [open, setOpen] = useState(false);
  const { data: unreadCount = 0 } = useNotificationUnreadCount();
  // Only fetch the list while the sheet is open.
  const { data: notifications, isLoading } = useNotifications({ enabled: open });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  // The panel shows unread only — reading a row drops it from this list.
  const unread = (notifications ?? []).filter((n) => !n.isRead);
  const hasDot = unreadCount > 0;

  const onRowPress = (n: AppNotification) => {
    haptics.light();
    markRead.mutate(n.id);
    if (n.link) {
      setOpen(false);
      // Notification links are in-app routes (e.g. "/chat/<id>"); ignore any
      // that aren't navigable rather than crashing.
      try {
        router.push(n.link as unknown as Href);
      } catch {
        // no-op
      }
    }
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={
          hasDot ? `Notifications, ${unreadCount} unread` : "Notifications"
        }
        className="h-11 w-11 items-center justify-center rounded-full bg-card active:bg-muted"
      >
        <Bell size={20} color={tokens.foreground} />
        {hasDot ? ( 
          <View
            className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-red-500"
            // Ring in the button's background color so the dot reads as separate.
            style={{ borderWidth: 1.5, borderColor: tokens.card }}
          />
        ) : null}
      </Pressable>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <View className="flex-row items-center justify-between">
              <SheetTitle>Notifications</SheetTitle>
              {unread.length > 0 ? (
                <Pressable
                  onPress={() => {
                    haptics.light();
                    markAllRead.mutate();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Mark all as read"
                  className="flex-row items-center gap-1.5 active:opacity-60"
                >
                  <CheckCheck size={16} color={tokens.brand} />
                  <Text className="text-sm font-jakarta-semibold text-brand">Mark all read</Text>
                </Pressable>
              ) : null}
            </View>
          </SheetHeader>

          <ScrollView
            style={{ maxHeight: height * 0.6, flexShrink: 1 }}
            className="mt-2"
            contentContainerClassName="gap-2 pb-2"
            showsVerticalScrollIndicator={false}
          >
            {isLoading ? (
              <View className="gap-2 pt-2">
                <Skeleton className="h-16 w-full rounded-2xl" />
                <Skeleton className="h-16 w-full rounded-2xl" />
                <Skeleton className="h-16 w-full rounded-2xl" />
              </View>
            ) : unread.length === 0 ? (
              <View className="items-center gap-2 py-10">
                <Bell size={32} color={tokens.mutedForeground} />
                <Text className="text-sm text-muted-foreground">You're all caught up</Text>
              </View>
            ) : (
              unread.map((n) => {
                const Icon = iconFor(n);
                return (
                  <Pressable
                    key={n.id}
                    onPress={() => onRowPress(n)}
                    accessibilityRole="button"
                    className="flex-row gap-3 rounded-2xl border border-border bg-background p-3 active:opacity-70"
                  >
                    <View className="h-10 w-10 items-center justify-center rounded-full bg-brand/10">
                      <Icon size={18} color={tokens.brand} />
                    </View>
                    <View className="flex-1 gap-0.5">
                      <Text
                        className="text-sm font-jakarta-semibold text-foreground"
                        numberOfLines={1}
                      >
                        {n.title}
                      </Text>
                      <Text className="text-sm text-muted-foreground" numberOfLines={2}>
                        {n.body}
                      </Text>
                      <Text className="mt-0.5 text-xs text-muted-foreground">
                        {timeAgo(n.createdAt)}
                      </Text>
                    </View>
                    {markRead.isPending ? (
                      <ActivityIndicator size="small" color={tokens.mutedForeground} />
                    ) : null}
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </SheetContent>
      </Sheet>
    </>
  );
}
