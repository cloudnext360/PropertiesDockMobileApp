import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { AnimatePresence } from "moti";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { MotiView } from "@/components/ui/moti";
import { completeOnboarding } from "@/features/onboarding/onboarding-store";
import { OnboardingSlides } from "@/features/onboarding/OnboardingSlides";
import { SplashIntro } from "@/features/onboarding/SplashIntro";
import { ONBOARDING_SLIDES } from "@/features/onboarding/slides";

// How long the animated brand splash plays before crossfading into the slides.
const SPLASH_DURATION_MS = 2600;

/**
 * First-launch experience: animated brand splash → swipeable real-estate slides.
 * Shown only while the onboarding guard in app/_layout.tsx is active; calling
 * completeOnboarding() flips the guard and expo-router lands on the tab shell.
 */
export default function OnboardingScreen() {
  const [phase, setPhase] = useState<"splash" | "slides">("splash");

  useEffect(() => {
    // Warm the hero photos while the splash plays so slide 1 appears fully loaded.
    Image.prefetch(ONBOARDING_SLIDES.map((slide) => slide.image)).catch(() => {});
    const timer = setTimeout(() => setPhase("slides"), SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="light" />
      {phase === "slides" && <OnboardingSlides onFinish={completeOnboarding} />}
      {/* Splash sits on top and fades away, revealing the slides mid-entrance */}
      <AnimatePresence>
        {phase === "splash" && (
          <MotiView
            key="splash-intro"
            exit={{ opacity: 0, scale: 1.06 }}
            exitTransition={{ type: "timing", duration: 500 }}
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
          >
            <SplashIntro />
          </MotiView>
        )}
      </AnimatePresence>
    </View>
  );
}
