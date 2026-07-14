import { Image, StyleSheet, useWindowDimensions, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import { Text } from "@/components/ui";
import { MotiView } from "@/components/ui/moti";

import { ONBOARDING_ACCENT, ONBOARDING_ACCENT_DEEP } from "./slides";

const logoSource = require("../../../assets/images/splash-icon.png");
const glowSource = require("../../../assets/images/logo-glow.png");

/** A drifting translucent orb — pure decoration behind the logo. */
function FloatingOrb({
  size,
  top,
  left,
  duration,
  delay = 0,
}: {
  size: number;
  top: number;
  left: number;
  duration: number;
  delay?: number;
}) {
  return (
    <MotiView
      from={{ translateY: 0, opacity: 0 }}
      animate={{ translateY: -18, opacity: 1 }}
      transition={{
        translateY: { type: "timing", duration, loop: true, repeatReverse: true, delay },
        opacity: { type: "timing", duration: 800, delay },
      }}
      style={{
        position: "absolute",
        top,
        left,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "rgba(255,255,255,0.10)",
      }}
    />
  );
}

/**
 * Phase 1 of onboarding: the animated brand splash. The flat #208AEF base makes
 * the handoff from the native splash (same color + logo) seamless, then the
 * gradient, glow, wordmark and orbs animate in. Timing is owned by the parent
 * screen (app/onboarding.tsx), which crossfades to the slides.
 */
export function SplashIntro() {
  const { width, height } = useWindowDimensions();

  return (
    <View
      style={[StyleSheet.absoluteFill, { backgroundColor: ONBOARDING_ACCENT, overflow: "hidden" }]}
    >
      {/* Gradient washes in over the flat native-splash blue */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: "timing", duration: 900 }}
        style={StyleSheet.absoluteFill}
      >
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="splashGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#4FB2FF" />
              <Stop offset="0.45" stopColor={ONBOARDING_ACCENT} />
              <Stop offset="1" stopColor={ONBOARDING_ACCENT_DEEP} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width={width} height={height} fill="url(#splashGradient)" />
        </Svg>
      </MotiView>

      <FloatingOrb size={220} top={height * 0.08} left={-70} duration={3600} />
      <FloatingOrb size={130} top={height * 0.22} left={width - 80} duration={3000} delay={200} />
      <FloatingOrb size={90} top={height * 0.72} left={width * 0.12} duration={4200} delay={400} />

      <View className="flex-1 items-center justify-center">
        {/* Pulsing glow halo behind the logo */}
        <MotiView
          from={{ opacity: 0.35, scale: 1 }}
          animate={{ opacity: 0.8, scale: 1.18 }}
          transition={{ type: "timing", duration: 1600, loop: true, repeatReverse: true }}
          style={{ position: "absolute" }}
        >
          <Image source={glowSource} style={{ width: 300, height: 300 }} resizeMode="contain" />
        </MotiView>

        {/* Logo — exactly screen-centered at the native splash size (76px) on the
            first frame for a seamless handoff, then springs up */}
        <MotiView
          from={{ scale: 1, translateY: 0 }}
          animate={{ scale: 1.4, translateY: -8 }}
          transition={{ type: "spring", damping: 14, stiffness: 120, delay: 150 }}
        >
          <Image source={logoSource} style={{ width: 76, height: 76 }} resizeMode="contain" />
        </MotiView>

        {/* Wordmark + tagline anchored below center so they never shift the logo */}
        <View className="items-center" style={{ position: "absolute", top: "50%", marginTop: 64 }}>
          <MotiView
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 550, delay: 450 }}
            className="flex-row"
          >
            <Text className="text-4xl font-jakarta-extrabold text-white">Property</Text>
            <Text className="text-4xl font-jakarta-extrabold" style={{ color: "#AEE1FF" }}>
              Dock
            </Text>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 550, delay: 700 }}
          >
            <Text className="mt-2 text-base font-jakarta-medium text-white/80">
              Your place in Oman starts here
            </Text>
          </MotiView>
        </View>
      </View>

      {/* Loading dots hinting at the transition to the slides */}
      <View
        className="absolute bottom-16 w-full flex-row items-center justify-center gap-2"
        accessibilityElementsHidden
      >
        {[0, 1, 2].map((i) => (
          <MotiView
            key={i}
            from={{ opacity: 0.25, scale: 1 }}
            animate={{ opacity: 1, scale: 1.25 }}
            transition={{
              type: "timing",
              duration: 500,
              delay: 900 + i * 180,
              loop: true,
              repeatReverse: true,
            }}
            style={{
              width: 7,
              height: 7,
              borderRadius: 4,
              backgroundColor: "rgba(255,255,255,0.9)",
            }}
          />
        ))}
      </View>
    </View>
  );
}
