import { FlashList } from "@shopify/flash-list";
import { useRouter, type Href } from "expo-router";
import { Heart } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { toast } from "sonner-native";

import { AppImage, Button, Skeleton, Text } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useSavedProperties, useToggleSaveProperty } from "@/hooks/useSavedProperties";
import { formatOmr } from "@/constants/locale";
import { useThemeTokens } from "@/theme/theme-provider";
import type { SavedProperty } from "@/types/dashboard";

export function SavedList() {
  const router = useRouter();
  const { user } = useAuth();
  const tokens = useThemeTokens();
  const { data, isLoading } = useSavedProperties();
  const { remove } = useToggleSaveProperty();

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-white dark:bg-background px-8">
        <Text className="text-center text-muted-foreground">Sign in to view your saved properties.</Text>
        <Button variant="brand" size="sm" onPress={() => router.push("/auth")}>
          Sign in
        </Button>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="gap-3 bg-white dark:bg-background p-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </View>
    );
  }

  // Endpoint may be unavailable (MOBILE_PLAN §3) → data undefined → treated as empty.
  const items = data ?? [];
  if (items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center gap-2 bg-white dark:bg-background px-8">
        <Text className="text-center font-jakarta-semibold text-foreground">No saved properties</Text>
        <Text className="text-center text-sm text-muted-foreground">
          Tap the heart on any listing to save it here.
        </Text>
      </View>
    );
  }

  const unsave = (s: SavedProperty) =>
    remove.mutate(s.id, { onError: () => toast.error("Couldn't remove") });

  return (
    <FlashList
      data={items}
      keyExtractor={(s) => s.id}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => {
        const p = item.property;
        if (!p) return null;
        const image = p.images?.[0]?.url;
        return (
          <Pressable
            onPress={() =>
              router.push({ pathname: "/property/[slug]", params: { slug: p.slug } } as unknown as Href)
            }
            className="mb-3 flex-row gap-3 rounded-xl border border-border bg-card p-2.5 active:opacity-90"
          >
            <View className="h-20 w-24 overflow-hidden rounded-lg bg-muted">
              <AppImage
                source={image ? { uri: image } : undefined}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                recyclingKey={p.id}
              />
            </View>
            <View className="flex-1 justify-center gap-0.5">
              <Text className="text-sm font-jakarta-bold text-brand">
                {formatOmr(p.price, p.currency, p.listingType)}
              </Text>
              <Text className="font-jakarta-semibold text-foreground" numberOfLines={1}>
                {p.propertyName}
              </Text>
              <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                {p.city}
              </Text>
            </View>
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                unsave(item);
              }}
              hitSlop={10}
              accessibilityLabel="Remove from saved"
              className="h-11 w-11 items-center justify-center self-center rounded-full active:bg-muted"
            >
              <Heart size={20} color={tokens.destructive} fill={tokens.destructive} />
            </Pressable>
          </Pressable>
        );
      }}
    />
  );
}
