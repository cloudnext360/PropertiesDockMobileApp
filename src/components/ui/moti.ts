import { MotiView } from "moti";
import { cssInterop } from "nativewind";

// MotiView is not a core RN component, so enable `className` → `style` interop.
// Imported wherever we animate a NativeWind-styled view (skeleton, dialog, sheet).
cssInterop(MotiView, { className: "style" });

export { MotiView };
