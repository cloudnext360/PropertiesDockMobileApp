import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";

import { apiPost } from "@/lib/api";

export type PushPermission = "granted" | "denied" | "unavailable";

// expo-notifications' remote-push support was removed from Expo Go in SDK 53 —
// importing it there throws at module load. So we only load it in a dev/standalone
// build, and it gracefully no-ops in Expo Go and on web.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/** Lazily load expo-notifications; returns null where it's unavailable (Expo Go / web). */
export function getNotifications(): typeof import("expo-notifications") | null {
  if (Platform.OS === "web" || isExpoGo) return null;
  // Guarded require (not a top-level import) so the module is never evaluated in Expo Go.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("expo-notifications") as typeof import("expo-notifications");
}

/** Foreground presentation: show a banner + list entry, no sound. */
export function configureNotificationHandler() {
  const Notifications = getNotifications();
  if (!Notifications) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: true,
    }),
  });
}

/**
 * Requests permission (with the OS rationale) and returns an Expo push token.
 * Gracefully returns a status when unavailable/denied — never throws.
 * Requires a physical device + EAS projectId + a dev build (not Expo Go on SDK 53+).
 */
export async function registerForPushNotifications(): Promise<{
  status: PushPermission;
  token: string | null;
}> {
  const Notifications = getNotifications();
  if (!Notifications || !Device.isDevice) {
    return { status: "unavailable", token: null };
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let granted = existing.granted;
  if (!granted && existing.canAskAgain) {
    granted = (await Notifications.requestPermissionsAsync()).granted;
  }
  if (!granted) return { status: "denied", token: null };

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return { status: "granted", token: null }; // needs EAS projectId

  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return { status: "granted", token: data };
  } catch {
    return { status: "granted", token: null };
  }
}

/** POST the token to the backend for the current user. See EXPO_PUSH_SPEC (backend). */
export async function sendTokenToBackend(token: string): Promise<void> {
  try {
    await apiPost("/api/notifications/push/expo-token", { token, platform: Platform.OS });
  } catch {
    // Endpoint not shipped yet — safe to ignore until the backend adds it.
  }
}

/** Map a notification's `data` payload to an in-app route (deep link on tap). */
export function routeFromNotification(data: Record<string, unknown> | undefined): string | null {
  if (!data) return null;
  if (typeof data.url === "string") return data.url;
  const type = typeof data.type === "string" ? data.type : undefined;
  const slug = typeof data.slug === "string" ? data.slug : undefined;
  const id = typeof data.id === "string" ? data.id : undefined;
  if (type === "PROPERTY" && slug) return `/property/${slug}`;
  if (type === "AGENCY" && slug) return `/agency/${slug}`;
  if (type === "USER" && id) return `/users/${id}`;
  if (type === "INQUIRY") return "/account/inquiries";
  return null;
}
