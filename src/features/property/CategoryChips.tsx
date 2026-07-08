import {
  Building,
  Building2,
  Home,
  Hotel,
  LayoutGrid,
  Trees,
  type LucideIcon,
} from "lucide-react-native";
import { Pressable, ScrollView, View } from "react-native";

import { Text } from "@/components/ui";
import type { PropertyFilters } from "@/hooks/useProperties";
import { cn } from "@/lib/utils";
import { useThemeTokens } from "@/theme/theme-provider";

interface Category {
  key: string;
  label: string;
  icon: LucideIcon;
  /** Partial filter merged into the Recommended query when this chip is active. */
  filter: Pick<PropertyFilters, "category" | "majorType">;
}

// `majorType` values map 1:1 to the backend enum (see taxonomy/property.ts).
export const CATEGORIES: Category[] = [
  { key: "all", label: "All", icon: LayoutGrid, filter: {} },
  { key: "house", label: "House", icon: Home, filter: { majorType: "SINGLE_FAMILY_HOME" } },
  { key: "apartment", label: "Apartment", icon: Building2, filter: { majorType: "APARTMENT_FLAT" } },
  { key: "villa", label: "Villa", icon: Hotel, filter: { majorType: "VILLA_BUNGALOW" } },
  {
    key: "office",
    label: "Office",
    icon: Building,
    filter: { category: "COMMERCIAL", majorType: "OFFICE_BUILDINGS" },
  },
  {
    key: "land",
    label: "Land",
    icon: Trees,
    filter: { category: "COMMERCIAL", majorType: "LAND_COMMERCIAL_USE" },
  },
];

/** Resolve a chip key to its query filter (empty object for "all"/unknown). */
export function categoryFilter(key: string): Pick<PropertyFilters, "category" | "majorType"> {
  return CATEGORIES.find((c) => c.key === key)?.filter ?? {};
}

interface CategoryChipsProps {
  selected: string;
  onSelect: (key: string) => void;
}

export function CategoryChips({ selected, onSelect }: CategoryChipsProps) {
  const tokens = useThemeTokens();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-2.5 px-4"
    >
      {CATEGORIES.map((c) => {
        const active = c.key === selected;
        const isAll = c.key === "all";
        const Icon = c.icon;

        return (
          <Pressable
            key={c.key}
            onPress={() => onSelect(c.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={c.label}
            className={cn(
              "h-12 flex-row items-center rounded-full border",
              active ? "border-brand bg-brand" : "border-border bg-card active:bg-muted",
              isAll ? "px-5" : "py-1.5 pl-1.5 pr-4",
            )}
          >
            {isAll ? null : (
              <View
                className={cn(
                  "mr-2 h-9 w-9 items-center justify-center rounded-full",
                  active ? "bg-white/20" : "bg-muted",
                )}
              >
                <Icon size={17} color={active ? tokens.brandForeground : tokens.foreground} />
              </View>
            )}
            <Text
              className={cn(
                "text-sm font-jakarta-semibold",
                active ? "text-brand-foreground" : "text-foreground",
              )}
            >
              {c.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
