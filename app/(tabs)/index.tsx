import { useRouter } from "expo-router";
import { Bell, MapPin, Search } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";

import { FadeInView, Skeleton, Text } from "@/components/ui";
import { CategoryChips, categoryFilter } from "@/features/property/CategoryChips";
import { FeaturedPropertyCard } from "@/features/property/FeaturedPropertyCard";
import { useAuth } from "@/context/AuthContext";
import { useProperties } from "@/hooks/useProperties";
import { useSavedProperties, useToggleSaveProperty } from "@/hooks/useSavedProperties";
import { useThemeTokens } from "@/theme/theme-provider";
import type { ApiProperty } from "@/types/api";

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tokens = useThemeTokens();
  const { user } = useAuth();

  const [category, setCategory] = useState("all");
  const filters = useMemo(
    () => ({ limit: 10, sortBy: "newest" as const, ...categoryFilter(category) }),
    [category],
  );
  const { data, isLoading } = useProperties(filters);
  const items = data?.properties ?? [];

  // Save/unsave wiring (mirrors the Buy screen) so the heart is functional.
  const savedQuery = useSavedProperties();
  const { save, remove } = useToggleSaveProperty();
  const savedMap = useMemo(() => {
    const m = new Map<string, string>();
    (savedQuery.data ?? []).forEach((s) => {
      const pid = s.property?.id ?? s.propertyId;
      if (pid) m.set(pid, s.id);
    });
    return m;
  }, [savedQuery.data]);

  const onToggleSave = useCallback(
    (property: ApiProperty) => {
      if (!user) {
        toast("Sign in to save properties");
        return;
      }
      const savedId = savedMap.get(property.id);
      if (savedId) {
        remove.mutate(savedId, { onError: () => toast.error("Couldn't update saved") });
      } else {
        save.mutate(property.id, { onError: () => toast.error("Saving is unavailable right now") });
      }
    },
    [user, savedMap, save, remove],
  );

  return (
    <View className="flex-1 bg-background">
      {/* Location + notifications */}
      <View style={{ paddingTop: insets.top }} className="px-4">
        <View className="h-14 flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5">
            <MapPin size={18} color={tokens.brand} />
            <Text className="text-base font-jakarta-semibold text-foreground">Muscat</Text>
          </View>
          <Pressable
            onPress={() => toast("You're all caught up")}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            className="h-11 w-11 items-center justify-center rounded-full bg-card active:bg-muted"
          >
            <Bell size={20} color={tokens.foreground} />
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <FadeInView className="gap-4">
          <View className="gap-1 px-4 pt-1">
            <Text className="text-3xl font-jakarta-extrabold leading-tight text-foreground">
              Find your place in Oman
            </Text>
            <Text className="text-sm text-muted-foreground">
              Buy, rent, and invest with confidence.
            </Text>
          </View>

          <View className="px-4">
            <Pressable
              onPress={() => router.push("/search")}
              accessibilityRole="search"
              accessibilityLabel="Search properties"
              className="h-14 flex-row items-center gap-3 rounded-full border border-border bg-card px-4 active:opacity-90"
            >
              <Search size={20} color={tokens.mutedForeground} />
              <Text className="text-base text-muted-foreground">Search by locations</Text>
            </Pressable>
          </View>

          <CategoryChips selected={category} onSelect={setCategory} />
        </FadeInView>

        <View className="gap-4 px-4 pt-6">
          <Text className="text-xl font-jakarta-bold text-foreground">Recommended for you</Text>

          {isLoading ? (
            <View className="gap-6">
              <Skeleton className="h-72 w-full rounded-3xl" />
              <Skeleton className="h-72 w-full rounded-3xl" />
            </View>
          ) : items.length === 0 ? (
            <Text className="text-sm text-muted-foreground">No listings in this category yet.</Text>
          ) : (
            <View className="gap-6">
              {items.map((p) => (
                <FeaturedPropertyCard
                  key={p.id}
                  property={p}
                  isSaved={savedMap.has(p.id)}
                  onToggleSave={onToggleSave}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
