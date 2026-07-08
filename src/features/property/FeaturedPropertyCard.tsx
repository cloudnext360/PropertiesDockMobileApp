import { useRouter, type Href } from "expo-router";
import { Bath, BedDouble, Heart, MapPin, Maximize } from "lucide-react-native";
import { memo } from "react";
import { Pressable, View } from "react-native";

import { AppImage, Text } from "@/components/ui";
import { formatOmr } from "@/constants/locale";
import { haptics } from "@/lib/haptics";
import { useThemeTokens } from "@/theme/theme-provider";
import type { ApiProperty } from "@/types/api";

interface FeaturedPropertyCardProps {
  property: ApiProperty;
  isSaved?: boolean;
  /** When provided, renders the save/favorite heart. */
  onToggleSave?: (property: ApiProperty) => void;
}

/**
 * Home "Recommended for you" card — large rounded hero image with a deal badge
 * and a floating save heart, then the name/price line and a row of spec pills.
 * Distinct from PropertyCard (used in the Buy list) so the two layouts can evolve
 * independently.
 */
export const FeaturedPropertyCard = memo(function FeaturedPropertyCard({
  property,
  isSaved,
  onToggleSave,
}: FeaturedPropertyCardProps) {
  const router = useRouter();
  const tokens = useThemeTokens();
  const primary = property.images.find((i) => i.isPrimary) ?? property.images[0];
  const isSale = property.listingType === "SALE";
  const location = [property.city, property.state].filter(Boolean).join(", ");

  return (
    <Pressable
      onPress={() =>
        // Cast: the SDK's typed-routes generator currently omits this dynamic route.
        router.push({ pathname: "/property/[slug]", params: { slug: property.slug } } as unknown as Href)
      }
      accessibilityRole="button"
      accessibilityLabel={`${property.propertyName}, ${formatOmr(property.price, property.currency, property.listingType)}, ${location}`}
      className="gap-3 active:opacity-95"
    >
      <View className="overflow-hidden rounded-3xl bg-muted">
        <View className="aspect-[16/11]">
          <AppImage
            source={primary?.url ? { uri: primary.url } : undefined}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            recyclingKey={property.id}
          />
        </View>

        <View className="absolute left-3 top-3 rounded-full bg-card px-3 py-1.5">
          <Text className="text-xs font-jakarta-bold text-foreground">
            {property.isFeatured ? "Best deal" : isSale ? "For sale" : "For rent"}
          </Text>
        </View>

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
            className="absolute right-3 top-3 h-10 w-10 items-center justify-center rounded-full bg-card active:opacity-80"
          >
            <Heart
              size={18}
              color={isSaved ? tokens.destructive : tokens.foreground}
              fill={isSaved ? tokens.destructive : "transparent"}
            />
          </Pressable>
        ) : null}
      </View>

      <View className="flex-row items-center justify-between gap-3 px-1">
        <Text className="flex-1 text-lg font-jakarta-bold text-foreground" numberOfLines={1}>
          {property.propertyName}
        </Text>
        <Text className="text-lg font-jakarta-extrabold text-brand">
          {formatOmr(property.price, property.currency, property.listingType)}
        </Text>
      </View>

      <View className="flex-row flex-wrap items-center gap-2 px-1">
        {location ? (
          <SpecPill icon={<MapPin size={13} color={tokens.mutedForeground} />} label={property.city || location} />
        ) : null}
        {property.bedrooms != null ? (
          <SpecPill icon={<BedDouble size={14} color={tokens.mutedForeground} />} label={`${property.bedrooms} Bed`} />
        ) : null}
        {property.bathrooms != null ? (
          <SpecPill icon={<Bath size={14} color={tokens.mutedForeground} />} label={`${property.bathrooms} Bath`} />
        ) : null}
        {property.areaSqm != null ? (
          <SpecPill icon={<Maximize size={14} color={tokens.mutedForeground} />} label={`${property.areaSqm} m²`} />
        ) : null}
      </View>
    </Pressable>
  );
});

function SpecPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View className="flex-row items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1">
      {icon}
      <Text className="text-xs font-jakarta-medium text-muted-foreground">{label}</Text>
    </View>
  );
}
