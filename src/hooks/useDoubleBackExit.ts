import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef } from "react";
import { BackHandler, Platform, ToastAndroid } from "react-native";

/** Second back press within this window exits the app. */
const EXIT_WINDOW_MS = 2000;

/**
 * Android hardware-back handler for the tab shell ("press back again to exit").
 *
 * While the host route is focused, a back press that React Navigation can still
 * handle (nested stack pop, tab backBehavior="history") is left alone. Once the
 * history is exhausted — i.e. back would close the app — the first press shows
 * a toast and the second press within EXIT_WINDOW_MS actually exits.
 *
 * No-op on iOS (no hardware back button).
 */
export function useDoubleBackExit() {
  const router = useRouter();
  const lastPressRef = useRef(0);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return;

      const onBackPress = () => {
        // canGoBack() simulates GO_BACK through the focused navigator chain,
        // so it is true while tab history / nested stacks can still unwind.
        if (router.canGoBack()) return false;

        const now = Date.now();
        if (now - lastPressRef.current < EXIT_WINDOW_MS) {
          BackHandler.exitApp();
          return true;
        }
        lastPressRef.current = now;
        ToastAndroid.show("Press back again to exit", ToastAndroid.SHORT);
        return true;
      };

      const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => sub.remove();
    }, [router]),
  );
}
