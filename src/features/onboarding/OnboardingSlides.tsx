import { Image } from "expo-image";
import { ArrowRight } from "lucide-react-native";
import { useCallback, useRef, useState } from "react";
import {
  type FlatList,
  type ListRenderItemInfo,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  runOnJS,
  type SharedValue,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

import { Text } from "@/components/ui";
import { haptics } from "@/lib/haptics";

import {
  ONBOARDING_ACCENT,
  ONBOARDING_SLIDES,
  type OnboardingSlide,
  SLIDE_BLURHASH,
} from "./slides";

const COUNT = ONBOARDING_SLIDES.length;
const DOT_INACTIVE = "rgba(148, 163, 184, 0.5)";

// Parallax: the hero image is 1.6× the slide width and drifts ±0.3× while swiping,
// so its edges never enter the viewport.
const IMAGE_OVERSCAN = 1.6;
const PARALLAX_SHIFT = 0.3;

// Circular next button + its progress ring, morphing into a "Get Started" pill.
const BUTTON_SIZE = 64;
const MORPH_WIDTH = 190;
const RING_SIZE = 78;
const RING_RADIUS = 35;
const RING_STROKE = 3.5;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface SlideItemProps {
  slide: OnboardingSlide;
  index: number;
  scrollX: SharedValue<number>;
  width: number;
  height: number;
}

function SlideItem({ slide, index, scrollX, width, height }: SlideItemProps) {
  const input = [(index - 1) * width, index * width, (index + 1) * width];

  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          scrollX.value,
          input,
          [-width * PARALLAX_SHIFT, 0, width * PARALLAX_SHIFT],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  // Text drifts faster than the page and fades at the edges — depth against the parallax.
  const contentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, input, [0, 1, 0], Extrapolation.CLAMP),
    transform: [
      {
        translateX: interpolate(
          scrollX.value,
          input,
          [width * 0.4, 0, -width * 0.4],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return (
    <View style={{ width, height }}>
      <View
        className="bg-muted"
        style={{
          height: height * 0.66,
          overflow: "hidden",
          borderBottomLeftRadius: 44,
          borderBottomRightRadius: 44,
        }}
      >
        <Animated.View
          style={[
            { width: width * IMAGE_OVERSCAN, marginLeft: -width * PARALLAX_SHIFT, height: "100%" },
            imageStyle,
          ]}
        >
          <Image
            source={{ uri: slide.image }}
            placeholder={{ blurhash: SLIDE_BLURHASH }}
            placeholderContentFit="cover"
            contentFit="cover"
            transition={300}
            cachePolicy="disk"
            recyclingKey={slide.id}
            style={{ flex: 1 }}
            accessibilityIgnoresInvertColors
          />
        </Animated.View>
      </View>

      <Animated.View style={[{ flex: 1 }, contentStyle]}>
        <View className="flex-1 items-center justify-center gap-3 px-8">
          <View
            style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: ONBOARDING_ACCENT }}
          />
          <Text className="text-center text-[26px] font-jakarta-extrabold leading-9 text-foreground">
            {slide.title}
          </Text>
          <Text className="text-center text-[15px] leading-6 text-muted-foreground">
            {slide.description}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

function Dot({ index, scrollX, width }: { index: number; scrollX: SharedValue<number>; width: number }) {
  const input = [(index - 1) * width, index * width, (index + 1) * width];
  const style = useAnimatedStyle(() => ({
    width: interpolate(scrollX.value, input, [8, 26, 8], Extrapolation.CLAMP),
    backgroundColor: interpolateColor(scrollX.value, input, [
      DOT_INACTIVE,
      ONBOARDING_ACCENT,
      DOT_INACTIVE,
    ]),
  }));
  return <Animated.View style={[{ height: 8, borderRadius: 4 }, style]} />;
}

interface NextButtonProps {
  scrollX: SharedValue<number>;
  width: number;
  isLast: boolean;
  onPress: () => void;
}

/**
 * Circular arrow button with a progress ring that fills as you swipe, then
 * morphs into a full "Get Started" pill on the last slide — all scroll-driven.
 */
function NextButton({ scrollX, width, isLast, onPress }: NextButtonProps) {
  const morphInput = [(COUNT - 2) * width, (COUNT - 1) * width];
  const pressScale = useSharedValue(1);

  const containerStyle = useAnimatedStyle(() => ({
    width:
      COUNT > 1
        ? interpolate(scrollX.value, morphInput, [BUTTON_SIZE, MORPH_WIDTH], Extrapolation.CLAMP)
        : MORPH_WIDTH,
    transform: [{ scale: pressScale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollX.value,
      [morphInput[0], morphInput[0] + width * 0.4],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  const ringProps = useAnimatedProps(() => {
    const progress = Math.min(1, Math.max(0, (scrollX.value / width + 1) / COUNT));
    return { strokeDashoffset: RING_CIRCUMFERENCE * (1 - progress) };
  });

  const arrowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollX.value,
      [morphInput[0], morphInput[0] + width * 0.5],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollX.value,
      [morphInput[0] + width * 0.5, morphInput[1]],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <View
      style={{ height: RING_SIZE, justifyContent: "center", alignItems: "flex-end" }}
      collapsable={false}
    >
      {/* Progress ring — anchored on the circular button, fades out during the morph */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            right: (BUTTON_SIZE - RING_SIZE) / 2,
            top: 0,
            width: RING_SIZE,
            height: RING_SIZE,
          },
          ringStyle,
        ]}
      >
        <Svg width={RING_SIZE} height={RING_SIZE}>
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke="rgba(32, 138, 239, 0.18)"
            strokeWidth={RING_STROKE}
            fill="none"
          />
          <AnimatedCircle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke={ONBOARDING_ACCENT}
            strokeWidth={RING_STROKE}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${RING_CIRCUMFERENCE}`}
            animatedProps={ringProps}
            rotation={-90}
            originX={RING_SIZE / 2}
            originY={RING_SIZE / 2}
          />
        </Svg>
      </Animated.View>

      <Pressable
        onPress={onPress}
        onPressIn={() => {
          pressScale.value = withSpring(0.92, { damping: 15, stiffness: 300 });
        }}
        onPressOut={() => {
          pressScale.value = withSpring(1, { damping: 15, stiffness: 300 });
        }}
        accessibilityRole="button"
        accessibilityLabel={isLast ? "Get started" : "Next slide"}
      >
        <Animated.View
          style={[
            {
              height: BUTTON_SIZE,
              borderRadius: BUTTON_SIZE / 2,
              backgroundColor: ONBOARDING_ACCENT,
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            },
            containerStyle,
          ]}
        >
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { alignItems: "center", justifyContent: "center" },
              arrowStyle,
            ]}
          >
            <ArrowRight color="#FFFFFF" size={26} />
          </Animated.View>
          <Animated.Text
            numberOfLines={1}
            style={[
              { color: "#FFFFFF", fontFamily: "PlusJakartaSans_700Bold", fontSize: 16 },
              labelStyle,
            ]}
          >
            Get Started
          </Animated.Text>
        </Animated.View>
      </Pressable>
    </View>
  );
}

interface OnboardingSlidesProps {
  /** Called when the user taps Skip or Get Started. */
  onFinish: () => void;
}

/** Phase 2 of onboarding: the swipeable real-estate slides. */
export function OnboardingSlides({ onFinish }: OnboardingSlidesProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList>(null);
  const [index, setIndex] = useState(0);
  const [listHeight, setListHeight] = useState(0);

  const scrollX = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
  });

  const handleIndexChange = useCallback((next: number) => {
    setIndex(next);
    haptics.selection();
  }, []);

  useAnimatedReaction(
    () => Math.min(COUNT - 1, Math.max(0, Math.round(scrollX.value / width))),
    (current, previous) => {
      if (previous !== null && current !== previous) {
        runOnJS(handleIndexChange)(current);
      }
    },
    [width, handleIndexChange],
  );

  const goNext = useCallback(() => {
    if (index < COUNT - 1) {
      haptics.light();
      listRef.current?.scrollToOffset({ offset: (index + 1) * width, animated: true });
    } else {
      haptics.success();
      onFinish();
    }
  }, [index, width, onFinish]);

  const skip = useCallback(() => {
    haptics.selection();
    onFinish();
  }, [onFinish]);

  // Skip dissolves as the last slide arrives (the pill button takes over as the only CTA).
  const skipStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollX.value,
      [(COUNT - 2) * width, (COUNT - 1) * width],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  const renderItem = ({ item, index: itemIndex }: ListRenderItemInfo<OnboardingSlide>) => (
    <SlideItem slide={item} index={itemIndex} scrollX={scrollX} width={width} height={listHeight} />
  );

  return (
    <View className="flex-1 bg-background">
      <View className="flex-1" onLayout={(e) => setListHeight(e.nativeEvent.layout.height)}>
        {listHeight > 0 && (
          <Animated.FlatList
            ref={listRef}
            data={ONBOARDING_SLIDES}
            keyExtractor={(item: OnboardingSlide) => item.id}
            renderItem={renderItem}
            horizontal
            pagingEnabled
            bounces={false}
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          />
        )}
      </View>

      <View className="flex-row items-center justify-center gap-2 pb-5">
        {ONBOARDING_SLIDES.map((slide, i) => (
          <Dot key={slide.id} index={i} scrollX={scrollX} width={width} />
        ))}
      </View>

      <View
        className="flex-row items-center justify-between px-6"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <Animated.View style={skipStyle}>
          <Pressable
            onPress={skip}
            disabled={index === COUNT - 1}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
            className="py-3"
          >
            <Text className="text-base font-jakarta-semibold text-muted-foreground">Skip</Text>
          </Pressable>
        </Animated.View>

        <NextButton scrollX={scrollX} width={width} isLast={index === COUNT - 1} onPress={goNext} />
      </View>
    </View>
  );
}
