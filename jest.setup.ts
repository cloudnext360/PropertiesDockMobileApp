/* eslint-disable @typescript-eslint/no-require-imports */
// Global mocks for native modules so unit/component tests run in Node.

// lucide icons → inert components (avoids ESM transform + native SVG).
jest.mock("lucide-react-native", () => new Proxy({}, { get: () => () => null }));

// Reanimated + Moti → lightweight stand-ins.
jest.mock("react-native-reanimated", () => require("react-native-reanimated/mock"));
jest.mock("moti", () => {
  const { View, Text } = require("react-native");
  return { MotiView: View, MotiText: Text };
});

// NativeWind runtime → no-ops (className becomes inert; theme scheme = light).
jest.mock("nativewind", () => ({
  useColorScheme: () => ({ colorScheme: "light", setColorScheme: jest.fn(), toggleColorScheme: jest.fn() }),
  cssInterop: jest.fn(),
  remapProps: jest.fn(),
  styled: (c: unknown) => c,
  vars: () => ({}),
}));

// expo-image / FlashList → plain RN so lists + images render in tests.
jest.mock("expo-image", () => ({ Image: require("react-native").Image }));
jest.mock("@shopify/flash-list", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    FlashList: ({ data, renderItem, ListEmptyComponent, ListFooterComponent, keyExtractor }: any) => {
      const items = data ?? [];
      return React.createElement(
        View,
        null,
        items.length === 0
          ? typeof ListEmptyComponent === "function"
            ? React.createElement(ListEmptyComponent)
            : (ListEmptyComponent ?? null)
          : items.map((item: unknown, index: number) =>
              React.createElement(
                View,
                { key: keyExtractor ? keyExtractor(item, index) : index },
                renderItem({ item, index }),
              ),
            ),
        ListFooterComponent ?? null,
      );
    },
  };
});

// AsyncStorage → official mock.
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// expo native modules → minimal mocks.
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(async () => undefined),
  notificationAsync: jest.fn(async () => undefined),
  selectionAsync: jest.fn(async () => undefined),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium" },
  NotificationFeedbackType: { Success: "success", Warning: "warning" },
}));
jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(async () => undefined),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  getLastNotificationResponseAsync: jest.fn(async () => null),
  getPermissionsAsync: jest.fn(async () => ({ granted: false, canAskAgain: true })),
  requestPermissionsAsync: jest.fn(async () => ({ granted: false })),
  getExpoPushTokenAsync: jest.fn(async () => ({ data: "" })),
  AndroidImportance: { DEFAULT: 3 },
}));
jest.mock("expo-local-authentication", () => ({
  hasHardwareAsync: jest.fn(async () => false),
  isEnrolledAsync: jest.fn(async () => false),
  authenticateAsync: jest.fn(async () => ({ success: true })),
}));
jest.mock("@react-native-community/netinfo", () => ({
  addEventListener: jest.fn(() => () => undefined),
  useNetInfo: () => ({ isConnected: true }),
  fetch: jest.fn(async () => ({ isConnected: true })),
}));
jest.mock("sonner-native", () => ({
  Toaster: () => null,
  toast: Object.assign(jest.fn(), { success: jest.fn(), error: jest.fn() }),
}));
