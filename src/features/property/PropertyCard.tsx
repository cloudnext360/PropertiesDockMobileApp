import { useRouter, type Href } from "expo-router";
import { Bath, BedDouble, Heart, MapPin, Maximize } from "lucide-react-native";
import { memo } from "react";
import { Pressable, View } from "react-native";

import { ImageCarousel } from "@/features/property/ImageCarousel";
import { Badge, Text } from "@/components/ui";
import { formatOmr } from "@/constants/locale";
import { haptics } from "@/lib/haptics";
import { useThemeTokens } from "@/theme/theme-provider";
import type { ApiProperty } from "@/types/api";

interface PropertyCardProps {
  property: ApiProperty;
  isSaved?: boolean;
  /** When provided, renders the save/favorite heart. */
  onToggleSave?: (property: ApiProperty) => void;
}

function specText(n: number | null | undefined, unit: string) {
  return n != null ? `${n}${unit}` : null;
}

export const PropertyCard = memo(function PropertyCard({
  property,
  isSaved,
  onToggleSave,
}: PropertyCardProps) {
  const router = useRouter();
  const tokens = useThemeTokens();
  const images = property.images.map((i) => i.url);
  const isSale = property.listingType === "SALE";
  const showStatus = property.status && property.status !== "APPROVED";

  return (
    <Pressable
      onPress={() =>
        // Cast: the SDK's typed-routes generator currently omits this dynamic route.
        router.push({ pathname: "/property/[slug]", params: { slug: property.slug } } as unknown as Href)
      }
      accessibilityRole="button"
      accessibilityLabel={`${property.propertyName}, ${formatOmr(property.price, property.currency, property.listingType)}, ${[property.city, property.state].filter(Boolean).join(", ")}`}
      className="overflow-hidden rounded-xl border border-border bg-card active:scale-[0.98] active:opacity-95"
    >
      <View>
        <ImageCarousel images={images} aspectClassName="aspect-[16/10]" />

        {/* Top badges */}
        <View className="absolute left-2 top-2 flex-row gap-1.5">
          {property.isFeatured ? <Badge variant="brand">Featured</Badge> : null}
          {showStatus ? <Badge variant="destructive">{property.status}</Badge> : null}
        </View>

        {/* Save toggle (≥44pt hit area) */}
        {onToggleSave ? (
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              haptics.light();
              onToggleSave(property);
            }}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={isSaved ? "Remove from saved" : "Save property"}
            className="absolute right-2 top-2 h-11 w-11 items-center justify-center rounded-full bg-black/35 active:bg-black/50"
          >
            <Heart
              size={20}
              color={isSaved ? tokens.destructive : "#ffffff"}
              fill={isSaved ? tokens.destructive : "transparent"}
            />
          </Pressable>
        ) : null}
      </View>

      <View className="gap-1.5 p-3">
        <Text className="text-lg font-jakarta-extrabold text-brand">
          {formatOmr(property.price, property.currency, property.listingType)}
        </Text>
        <Text className="font-jakarta-semibold text-foreground" numberOfLines={1}>
          {property.propertyName}
        </Text>
        <View className="flex-row items-center gap-1">
          <MapPin size={13} color={tokens.mutedForeground} />
          <Text className="flex-1 text-xs text-muted-foreground" numberOfLines={1}>
            {[property.city, property.state].filter(Boolean).join(", ")}
          </Text>
          <Badge variant="outline">{isSale ? "For Sale" : "For Rent"}</Badge>
        </View>

        <View className="mt-1 flex-row items-center gap-4">
          {specText(property.bedrooms, "") ? (
            <Spec icon={<BedDouble size={15} color={tokens.mutedForeground} />} label={`${property.bedrooms} bd`} />
          ) : null}
          {specText(property.bathrooms, "") ? (
            <Spec icon={<Bath size={15} color={tokens.mutedForeground} />} label={`${property.bathrooms} ba`} />
          ) : null}
          {property.areaSqm != null ? (
            <Spec icon={<Maximize size={15} color={tokens.mutedForeground} />} label={`${property.areaSqm} m²`} />
          ) : null}
        </View>
      </View>
    </Pressable>
  );
});

function Spec({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View className="flex-row items-center gap-1">
      {icon}
      <Text className="text-xs text-muted-foreground">{label}</Text>
    </View>
  );
}
