import { cssInterop } from "nativewind";
import { KeyboardAvoidingView as KCKeyboardAvoidingView } from "react-native-keyboard-controller";

/**
 * Edge-to-edge-aware KeyboardAvoidingView. SDK 54 enables Android edge-to-edge,
 * which stops the window from resizing for the keyboard — so React Native's
 * built-in KeyboardAvoidingView can't push inputs above the keyboard on Android.
 * react-native-keyboard-controller's version handles it via keyboard insets.
 *
 * cssInterop keeps our NativeWind `className` working (it maps to `style`).
 */
cssInterop(KCKeyboardAvoidingView, { className: "style" });

export const KeyboardAvoidingView = KCKeyboardAvoidingView;
