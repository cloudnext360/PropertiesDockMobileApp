import { useRouter, type Href } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";

import { AppImage, Text } from "@/components/ui";
import { formatOmr } from "@/constants/locale";
import { useRecentlyViewed } from "@/lib/recently-viewed";

/** Horizontal "Recently viewed" row for Home, sourced from AsyncStorage. */
export function RecentlyViewedRow() {
  const router = useRouter();
  const { data } = useRecentlyViewed();
  const items = data ?? [];

  if (items.length === 0) return null;

  return (
    <View className="gap-2">
      <Text className="text-lg font-jakarta-bold text-foreground">Recently viewed</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-3 pr-4"
      >
        {items.map((p) => (
          <Pressable
            key={p.id}
            onPress={() =>
              router.push({ pathname: "/property/[slug]", params: { slug: p.slug } } as unknown as Href)
            }
            className="w-44 overflow-hidden rounded-xl border border-border bg-card active:opacity-90"
          >
            <View className="aspect-[16/10] bg-muted">
              <AppImage
                source={p.images?.[0]?.url ? { uri: p.images[0].url } : undefined}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                recyclingKey={p.id}
              />
            </View>
            <View className="gap-0.5 p-2">
              <Text className="text-sm font-jakarta-extrabold text-brand">
                {formatOmr(p.price, p.currency, p.listingType)}
              </Text>
              <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                {p.propertyName}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
