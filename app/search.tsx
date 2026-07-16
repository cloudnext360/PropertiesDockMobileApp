import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
// MAP DISABLED — re-add `List, MapPin` when restoring the list/map toggle.
import { ChevronLeft, Search, SlidersHorizontal } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";

import { Button, Skeleton, Text } from "@/components/ui";
import { CategoryChips, categoryFilter } from "@/features/property/CategoryChips";
import { FeaturedPropertyCard } from "@/features/property/FeaturedPropertyCard";
import { FilterSheet, type PropertyFilterValues } from "@/features/property/FilterSheet";
// MAP DISABLED — re-enable these with the map view + toggle below.
// import { PropertyCard } from "@/features/property/PropertyCard";
// import { PropertyMap } from "@/features/property/PropertyMap";
// import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useInfiniteProperties } from "@/hooks/useInfiniteProperties";
import { useSavedProperties, useToggleSaveProperty } from "@/hooks/useSavedProperties";
import { useThemeTokens } from "@/theme/theme-provider";
import type { ApiProperty } from "@/types/api";

function countActive(f: PropertyFilterValues): number {
  return Object.values(f).filter((v) => v !== undefined && v !== "").length;
}

/**
 * Property search / browse. Reached on demand from the Home search bar
 * (router.push("/search")) — it's a pushed root screen, not a tab, so it opens
 * full-screen with a back button instead of living in the bottom nav.
 */
export default function SearchScreen() {
  const router = useRouter();
  const tokens = useThemeTokens();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [filters, setFilters] = useState<PropertyFilterValues>({});
  const [filterOpen, setFilterOpen] = useState(false);
  // MAP DISABLED — re-enable these with the map view + toggle below.
  // const [view, setView] = useState<"list" | "map">("list");
  // const [selected, setSelected] = useState<ApiProperty | null>(null);

  // Debounce the search box into the query.
  useEffect(() => {
    const t = setTimeout(() => setSearch(text.trim()), 350);
    return () => clearTimeout(t);
  }, [text]);

  // The category chip is a quick filter layered over the sheet's filters.
  const activeFilters = useMemo(
    () => ({ ...filters, ...categoryFilter(category), search: search || undefined }),
    [filters, category, search],
  );

  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteProperties(activeFilters);

  const items = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);
  const total = data?.pages[0]?.pagination.total ?? 0;

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

  const activeCount = countActive(filters);

  return (
    <View className="flex-1 bg-white dark:bg-background">
      {/* Header: back + title, search pill + filter, category chips */}
      <View style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center gap-2 px-4 pt-1">
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            className="-ml-1 h-9 w-9 items-center justify-center rounded-full active:bg-card"
          >
            <ChevronLeft size={24} color={tokens.foreground} />
          </Pressable>
          <Text className="flex-1 text-2xl font-jakarta-extrabold text-foreground">Explore homes</Text>
          <Text className="text-xs text-muted-foreground">
            {isLoading ? "Loading…" : `${total} result${total === 1 ? "" : "s"}`}
          </Text>
        </View>

        <View className="mt-3 flex-row items-center gap-2 px-4">
          <View className="h-14 flex-1 flex-row items-center gap-3 rounded-full border border-border bg-card px-4">
            <Search size={20} color={tokens.mutedForeground} />
            <TextInput
              className="h-14 flex-1 text-base text-foreground"
              placeholder="Search by location or keyword"
              placeholderTextColor={tokens.mutedForeground}
              value={text}
              onChangeText={setText}
              returnKeyType="search"
              autoFocus
            />
          </View>
          <Pressable
            onPress={() => setFilterOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Filters"
            className="h-14 w-14 items-center justify-center rounded-full border border-border bg-card active:bg-muted"
          >
            <SlidersHorizontal size={20} color={tokens.foreground} />
            {activeCount > 0 ? (
              <View className="absolute -right-0.5 -top-0.5 h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1">
                <Text className="text-[10px] font-jakarta-bold text-brand-foreground">
                  {activeCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        <View className="mt-3">
          <CategoryChips selected={category} onSelect={setCategory} />
        </View>

        {/* MAP DISABLED — list/map toggle hidden. Re-enable with the map view + state + imports.
        <View className="mt-3 flex-row items-center justify-between px-4">
          <View className="flex-row overflow-hidden rounded-full border border-border">
            <Segment
              icon={<List size={15} color={view === "list" ? tokens.brandForeground : tokens.foreground} />}
              label="List"
              active={view === "list"}
              onPress={() => setView("list")}
            />
            <Segment
              icon={<MapPin size={15} color={view === "map" ? tokens.brandForeground : tokens.foreground} />}
              label="Map"
              active={view === "map"}
              onPress={() => setView("map")}
            />
          </View>
        </View>
        */}
      </View>

      {/* Body */}
      {/* MAP DISABLED — map view removed from the body. To re-enable, restore the toggle,
          the view/selected state, the PropertyMap/PropertyCard imports, and re-add this
          branch as the first arm of the ternary below (before the isLoading check):
      {view === "map" ? (
        <View className="mt-3 flex-1">
          <PropertyMap properties={items} onSelectProperty={setSelected} />
          {selected ? (
            <View className="absolute inset-x-0 bottom-4 px-4">
              <Pressable
                onPress={() => setSelected(null)}
                className="mb-1 self-end rounded-full bg-black/40 px-3 py-1"
              >
                <Text className="text-xs font-jakarta-semibold text-white">Close</Text>
              </Pressable>
              <PropertyCard
                property={selected}
                isSaved={savedMap.has(selected.id)}
                onToggleSave={onToggleSave}
              />
            </View>
          ) : null}
        </View>
      ) : ...}
      */}
      {isLoading ? (
        <LoadingList />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <View className="px-4 pb-6">
              <FeaturedPropertyCard
                property={item}
                isSaved={savedMap.has(item.id)}
                onToggleSave={onToggleSave}
              />
            </View>
          )}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={tokens.brand} />
          }
          ListEmptyComponent={
            <EmptyState
              onReset={() => {
                setFilters({});
                setCategory("all");
                setText("");
              }}
            />
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="py-4">
                <ActivityIndicator color={tokens.brand} />
              </View>
            ) : null
          }
        />
      )}

      <FilterSheet open={filterOpen} onOpenChange={setFilterOpen} value={filters} onApply={setFilters} />
    </View>
  );
}

// MAP DISABLED — Segment powered the list/map toggle. Re-enable with the map view
// (and re-add the `cn` import at the top).
// function Segment({
//   icon,
//   label,
//   active,
//   onPress,
// }: {
//   icon: React.ReactNode;
//   label: string;
//   active: boolean;
//   onPress: () => void;
// }) {
//   return (
//     <Pressable
//       onPress={onPress}
//       accessibilityRole="button"
//       accessibilityState={{ selected: active }}
//       className={cn("h-9 flex-row items-center gap-1.5 px-4", active ? "bg-brand" : "bg-card")}
//     >
//       {icon}
//       <Text
//         className={cn(
//           "text-sm font-jakarta-semibold",
//           active ? "text-brand-foreground" : "text-foreground",
//         )}
//       >
//         {label}
//       </Text>
//     </Pressable>
//   );
// }

function LoadingList() {
  return (
    <View className="gap-6 p-4 pt-4">
      {[0, 1].map((i) => (
        <View key={i} className="gap-3">
          <Skeleton className="aspect-[16/11] w-full rounded-3xl" />
          <View className="flex-row items-center justify-between">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-20" />
          </View>
          <View className="flex-row gap-2">
            <Skeleton className="h-7 w-20 rounded-full" />
            <Skeleton className="h-7 w-16 rounded-full" />
            <Skeleton className="h-7 w-16 rounded-full" />
          </View>
        </View>
      ))}
    </View>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View className="flex-1 items-center justify-center gap-3 px-8">
      <Text className="text-center font-jakarta-semibold text-foreground">
        Couldn&apos;t load properties
      </Text>
      <Text className="text-center text-sm text-muted-foreground">
        Check your connection and try again.
      </Text>
      <Button variant="brand" size="sm" onPress={onRetry}>
        Retry
      </Button>
    </View>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <View className="items-center justify-center gap-3 px-8 py-24">
      <Text className="text-center font-jakarta-semibold text-foreground">No properties found</Text>
      <Text className="text-center text-sm text-muted-foreground">
        Try widening your filters or search.
      </Text>
      <Button variant="outline" size="sm" onPress={onReset}>
        Clear filters
      </Button>
    </View>
  );
}
