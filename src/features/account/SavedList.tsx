import { FlashList } from "@shopify/flash-list";
import { useRouter, type Href } from "expo-router";
import { Ban, Heart, MapPin } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { toast } from "sonner-native";

import { AppImage, Button, Skeleton, Text } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useSavedProperties, useToggleSaveProperty } from "@/hooks/useSavedProperties";
import { formatOmr } from "@/constants/locale";
import { propertyAvailability } from "@/lib/property-status";
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

  // The generic message hid the real cause (401 vs 404 vs network), which made
  // "remove doesn't work" impossible to diagnose from the UI.
  const unsave = (s: SavedProperty) =>
    remove.mutate(s.id, {
      onError: (err) =>
        toast.error("Couldn't remove", {
          description: err instanceof Error ? err.message : undefined,
        }),
    });

  return (
    <FlashList
      data={items}
      keyExtractor={(s) => s.id}
      contentContainerStyle={{ padding: 16 }}
      ItemSeparatorComponent={() => <View className="h-3" />}
      renderItem={({ item }) => {
        const p = item.property;
        if (!p) return null;
        const image = p.images?.[0]?.url;
        const location = [p.city, p.country].filter(Boolean).join(", ");
        // Deletes are soft, so a saved entry still resolves after the listing is
        // pulled. Keep the card (so the user sees why it changed) but make it
        // inert — only the remove button stays active.
        const { available, label } = propertyAvailability(p.status);

        const card = (
          <>
            <View className="h-24 w-24 overflow-hidden rounded-xl bg-muted">
              <AppImage
                source={image ? { uri: image } : undefined}
                style={{ width: "100%", height: "100%", opacity: available ? 1 : 0.4 }}
                contentFit="cover"
                recyclingKey={p.id}
              />
            </View>

            <View className="flex-1 gap-1">
              <View className="flex-row items-start justify-between gap-2">
                {available ? (
                  <Text
                    className="flex-1 text-base font-jakarta-extrabold text-brand"
                    numberOfLines={1}
                  >
                    {formatOmr(p.price, p.currency, p.listingType)}
                  </Text>
                ) : (
                  <View className="flex-1 flex-row items-center gap-1">
                    <Ban size={13} color={tokens.mutedForeground} />
                    <Text
                      className="flex-1 text-xs font-jakarta-bold text-muted-foreground"
                      numberOfLines={1}
                    >
                      {label}
                    </Text>
                  </View>
                )}
                {/* 44pt target with NO negative margins: a negative margin pushes
                    part of the button outside the parent's bounds, and Android
                    clips touches (including hitSlop) to those bounds — so the
                    overhanging portion was simply dead. */}
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation?.();
                    unsave(item);
                  }}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Remove from saved"
                  className="h-11 w-11 items-center justify-center rounded-full active:bg-muted"
                >
                  <Heart size={20} color={tokens.destructive} fill={tokens.destructive} />
                </Pressable>
              </View>

              <Text
                className={
                  "font-jakarta-semibold " +
                  (available ? "text-foreground" : "text-muted-foreground line-through")
                }
                numberOfLines={2}
              >
                {p.propertyName}
              </Text>

              {location ? (
                <View className="flex-row items-center gap-1">
                  <MapPin size={12} color={tokens.mutedForeground} />
                  <Text className="flex-1 text-xs text-muted-foreground" numberOfLines={1}>
                    {location}
                  </Text>
                </View>
              ) : null}
            </View>
          </>
        );

        if (!available) {
          return (
            <View className="flex-row gap-3 rounded-2xl border border-border bg-muted/40 p-3">
              {card}
            </View>
          );
        }

        return (
          <Pressable
            onPress={() =>
              router.push({ pathname: "/property/[slug]", params: { slug: p.slug } } as unknown as Href)
            }
            accessibilityRole="button"
            className="flex-row gap-3 rounded-2xl border border-border bg-card p-3 active:opacity-90"
          >
            {card}
          </Pressable>
        );
      }}
    />
  );
}
