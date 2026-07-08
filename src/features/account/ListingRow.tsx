import { useRouter, type Href } from "expo-router";
import { Trash2 } from "lucide-react-native";
import { memo } from "react";
import { Pressable, View } from "react-native";

import { AppImage, Text } from "@/components/ui";
import { StatusBadge } from "@/features/account/StatusBadge";
import { formatOmr } from "@/constants/locale";
import { useThemeTokens } from "@/theme/theme-provider";
import type { ApiProperty } from "@/types/api";

interface ListingRowProps {
  property: ApiProperty;
  onDelete: (property: ApiProperty) => void;
}

export const ListingRow = memo(function ListingRow({ property, onDelete }: ListingRowProps) {
  const router = useRouter();
  const tokens = useThemeTokens();
  const image = property.images?.[0]?.url;

  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: "/property/[slug]", params: { slug: property.slug } } as unknown as Href)
      }
      accessibilityRole="button"
      accessibilityLabel={`${property.propertyName}, ${formatOmr(property.price, property.currency, property.listingType)}, status ${property.status}`}
      className="flex-row gap-3 rounded-xl border border-border bg-card p-2.5 active:opacity-90"
    >
      <View className="h-20 w-24 overflow-hidden rounded-lg bg-muted">
        <AppImage
          source={image ? { uri: image } : undefined}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          recyclingKey={property.id}
        />
      </View>

      <View className="flex-1 justify-between py-0.5">
        <View className="gap-0.5">
          <Text className="font-jakarta-semibold text-foreground" numberOfLines={1}>
            {property.propertyName}
          </Text>
          <Text className="text-sm font-jakarta-bold text-brand">
            {formatOmr(property.price, property.currency, property.listingType)}
          </Text>
        </View>
        <View className="flex-row items-center justify-between">
          <StatusBadge status={property.status} />
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              onDelete(property);
            }}
            hitSlop={10}
            accessibilityLabel="Delete listing"
            className="h-9 w-9 items-center justify-center rounded-full active:bg-muted"
          >
            <Trash2 size={18} color={tokens.destructive} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
});
