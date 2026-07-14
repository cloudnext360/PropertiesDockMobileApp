import { useRouter, type Href } from "expo-router";
import {
  ChevronDown,
  Clock,
  Eye,
  MapPin,
  MessageSquare,
  Share2,
  Trash2,
} from "lucide-react-native";
import { memo, useState } from "react";
import { Pressable, Share, View } from "react-native";

import {
  AppImage,
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Text,
} from "@/components/ui";
import { StatusBadge } from "@/features/account/StatusBadge";
import { formatOmr } from "@/constants/locale";
import { haptics } from "@/lib/haptics";
import { useThemeTokens } from "@/theme/theme-provider";
import type { MyProperty } from "@/hooks/useMyProperties";

interface ListingRowProps {
  property: MyProperty;
  onDelete: (property: MyProperty) => void;
}

/** "11 Jul 26" — short numeric-ish date matching the reference UI. */
function formatShortDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

/** One stat cell (Views / Leads) inside the stats strip. */
function Stat({
  icon: Icon,
  label,
  value,
  tint,
}: {
  icon: typeof Eye;
  label: string;
  value: number;
  tint: string;
}) {
  return (
    <View className="flex-1 flex-row items-center justify-center gap-2 py-2.5">
      <Icon size={18} color={tint} />
      <View>
        <Text className="text-[11px] text-muted-foreground">{label}</Text>
        <Text className="text-sm font-jakarta-bold text-foreground">{value}</Text>
      </View>
    </View>
  );
}

export const ListingRow = memo(function ListingRow({ property, onDelete }: ListingRowProps) {
  const router = useRouter();
  const tokens = useThemeTokens();
  const [actionsOpen, setActionsOpen] = useState(false);

  const image = property.images?.[0]?.url;
  const location = [property.city, property.governorate || property.country]
    .filter(Boolean)
    .join(", ");
  // "Published on …" once approved (went live), otherwise the creation date.
  const published = property.approvedAt ?? null;
  const dateLabel = published ? "Published" : "Created";
  const dateValue = formatShortDate(published ?? property.createdAt);
  const views = property.viewCount ?? 0;
  const leads = property._count?.inquiries ?? 0;

  const openListing = () =>
    router.push({
      pathname: "/property/[slug]",
      params: { slug: property.slug },
    } as unknown as Href);

  const onShare = async () => {
    setActionsOpen(false);
    try {
      await Share.share({
        message: `${property.propertyName} — ${formatOmr(
          property.price,
          property.currency,
          property.listingType,
        )}\nhttps://propertydock.app/property/${property.slug}`,
      });
    } catch {
      // user dismissed the share sheet — nothing to do
    }
  };

  const onDeletePress = () => {
    setActionsOpen(false);
    onDelete(property);
  };

  return (
    <View className="gap-3 rounded-2xl border border-border bg-card p-3">
      {/* Header: thumbnail + price / name / location / date, status pill top-right */}
      <Pressable
        onPress={openListing}
        accessibilityRole="button"
        accessibilityLabel={`${property.propertyName}, ${formatOmr(property.price, property.currency, property.listingType)}, status ${property.status}`}
        className="flex-row gap-3 active:opacity-90"
      >
        <View className="h-24 w-24 overflow-hidden rounded-xl bg-muted">
          <AppImage
            source={image ? { uri: image } : undefined}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            recyclingKey={property.id}
          />
        </View>

        <View className="flex-1 gap-1">
          <View className="flex-row items-start justify-between gap-2">
            <Text className="flex-1 text-base font-jakarta-extrabold text-brand" numberOfLines={1}>
              {formatOmr(property.price, property.currency, property.listingType)}
            </Text>
            <StatusBadge status={property.status} />
          </View>

          <Text className="font-jakarta-semibold text-foreground" numberOfLines={2}>
            {property.propertyName}
          </Text>

          {location ? (
            <View className="flex-row items-center gap-1">
              <MapPin size={12} color={tokens.mutedForeground} />
              <Text className="flex-1 text-xs text-muted-foreground" numberOfLines={1}>
                {location}
              </Text>
            </View>
          ) : null}

          {dateValue ? (
            <View className="flex-row items-center gap-1">
              <Clock size={12} color={tokens.mutedForeground} />
              <Text className="text-xs text-muted-foreground">
                {dateLabel} on {dateValue}
              </Text>
            </View>
          ) : null}
        </View>
      </Pressable>

      {/* Stats strip: Views | Leads */}
      <View className="flex-row items-center rounded-xl bg-muted">
        <Stat icon={Eye} label="Views" value={views} tint={tokens.brand} />
        <View className="my-2 w-px self-stretch bg-border" />
        <Stat icon={MessageSquare} label="Leads" value={leads} tint={tokens.brand} />
      </View>

      {/* Actions */}
      <View className="flex-row gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onPress={() => {
            haptics.light();
            setActionsOpen(true);
          }}
        >
          <View className="flex-row items-center gap-1.5">
            <Text className="font-jakarta-semibold text-foreground">Actions</Text>
            <ChevronDown size={16} color={tokens.foreground} />
          </View>
        </Button>
        <Button variant="brand" className="flex-1" onPress={openListing}>
          View
        </Button>
      </View>

      {/* Actions sheet */}
      <Sheet open={actionsOpen} onOpenChange={setActionsOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle numberOfLines={1}>{property.propertyName}</SheetTitle>
          </SheetHeader>

          <View className="mt-4 gap-1">
            <Pressable
              onPress={onShare}
              accessibilityRole="button"
              className="flex-row items-center gap-3 rounded-xl px-2 py-3.5 active:bg-muted"
            >
              <Share2 size={20} color={tokens.foreground} />
              <Text className="font-jakarta-medium text-foreground">Share listing</Text>
            </Pressable>

            <Pressable
              onPress={onDeletePress}
              accessibilityRole="button"
              className="flex-row items-center gap-3 rounded-xl px-2 py-3.5 active:bg-muted"
            >
              <Trash2 size={20} color={tokens.destructive} />
              <Text className="font-jakarta-medium text-destructive">Delete listing</Text>
            </Pressable>
          </View>
        </SheetContent>
      </Sheet>
    </View>
  );
});
