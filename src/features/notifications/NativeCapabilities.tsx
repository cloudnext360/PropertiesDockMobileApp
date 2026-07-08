import type { Href } from "expo-router";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

import { useAuth } from "@/context/AuthContext";
import {
  configureNotificationHandler,
  getNotifications,
  registerForPushNotifications,
  routeFromNotification,
  sendTokenToBackend,
} from "@/features/notifications/push";

/**
 * Side-effect-only component (renders null). Mounted inside the provider + router
 * tree so it can read auth + navigate. Registers the push token once signed in and
 * routes notification taps (foreground, background, and cold-start) to deep links.
 */
export function NativeCapabilities() {
  const router = useRouter();
  const { user } = useAuth();
  const registered = useRef(false);

  useEffect(() => {
    configureNotificationHandler();
  }, []);

  // Register + upload the push token once we have a signed-in user.
  useEffect(() => {
    if (Platform.OS === "web" || !user || registered.current) return;
    registered.current = true;
    (async () => {
      const { token } = await registerForPushNotifications();
      if (token) await sendTokenToBackend(token);
    })();
  }, [user]);

  // Route notification taps → the matching screen.
  useEffect(() => {
    const Notifications = getNotifications();
    if (!Notifications) return;
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const url = routeFromNotification(
        response.notification.request.content.data as Record<string, unknown>,
      );
      if (url) router.push(url as unknown as Href);
    });
    // App opened from a quit state by tapping a notification.
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        const url = routeFromNotification(
          response?.notification.request.content.data as Record<string, unknown> | undefined,
        );
        if (url) router.push(url as unknown as Href);
      })
      .catch(() => {});
    return () => sub.remove();
  }, [router]);

  return null;
}
