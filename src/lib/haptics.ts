import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

// Haptics are native-only; no-op on web. All calls are fire-and-forget.
const native = Platform.OS === "ios" || Platform.OS === "android";

export const haptics = {
  light() {
    if (native) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },
  medium() {
    if (native) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  },
  success() {
    if (native) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  },
  warning() {
    if (native) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  },
  selection() {
    if (native) Haptics.selectionAsync().catch(() => {});
  },
};
