import NetInfo from "@react-native-community/netinfo";
import { onlineManager } from "@tanstack/react-query";

// Bridge NetInfo → React Query's onlineManager so queries/mutations pause offline
// and auto-resume on reconnect. Imported once for its side effect (see providers).
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(state.isConnected == null ? true : state.isConnected);
  });
});
