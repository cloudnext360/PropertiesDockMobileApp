import { useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";

import { AppImage } from "@/components/ui";
import { cn } from "@/lib/utils";

interface ImageCarouselProps {
  /** Already-resolved image URLs. */
  images: string[];
  /** Tailwind aspect utility for the container (ignored if `height` is set). */
  aspectClassName?: string;
  /** Fixed height instead of an aspect ratio (e.g. full-bleed gallery). */
  height?: number;
  roundedClassName?: string;
  onImagePress?: (index: number) => void;
}

/** Paged, swipeable image carousel (expo-image) with dot indicators. */
export function ImageCarousel({
  images,
  aspectClassName = "aspect-[4/3]",
  height,
  roundedClassName = "",
  onImagePress,
}: ImageCarouselProps) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [index, setIndex] = useState(0);
  const data = images.length ? images : [""];

  return (
    <View
      className={cn("overflow-hidden bg-muted", roundedClassName, height ? "" : aspectClassName)}
      style={height ? { height } : undefined}
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      {size.w > 0 && (
        <FlatList
          data={data}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, i) => String(i)}
          getItemLayout={(_, i) => ({ length: size.w, offset: size.w * i, index: i })}
          onMomentumScrollEnd={(e) =>
            setIndex(Math.round(e.nativeEvent.contentOffset.x / size.w))
          }
          renderItem={({ item, index: i }) => (
            <Pressable
              disabled={!onImagePress}
              onPress={() => onImagePress?.(i)}
              style={{ width: size.w, height: size.h }}
            >
              <AppImage
                source={item ? { uri: item } : undefined}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                recyclingKey={item}
              />
            </Pressable>
          )}
        />
      )}

      {data.length > 1 && (
        <View className="absolute bottom-2 w-full flex-row items-center justify-center gap-1.5">
          {data.map((_, i) => (
            <View
              key={i}
              className={cn(
                "h-1.5 rounded-full",
                i === index ? "w-4 bg-white" : "w-1.5 bg-white/60",
              )}
            />
          ))}
        </View>
      )}
    </View>
  );
}
