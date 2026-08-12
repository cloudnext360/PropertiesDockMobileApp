import { useLocalSearchParams, useRouter } from "expo-router";
import { Building2, CheckCircle2, Home, Users } from "lucide-react-native";
import { useCallback, useMemo } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { toast } from "sonner-native";

import {
  AppImage,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  FadeInView,
  Separator,
  Skeleton,
  Text,
} from "@/components/ui";
import { PropertyCard } from "@/features/property/PropertyCard";
import { useAuth } from "@/context/AuthContext";
import { useAgencyBySlug } from "@/hooks/useAgencyBySlug";
import { useProperties } from "@/hooks/useProperties";
import { useSavedProperties, useToggleSaveProperty } from "@/hooks/useSavedProperties";
import { resolveImageUrl } from "@/lib/utils";
import { useThemeTokens } from "@/theme/theme-provider";
import type { ApiProperty } from "@/types/api";

/**
 * Public agency page — target of the agency chips on a user profile and of the
 * /agency/:slug deep link.
 *
 * Two requests: the profile itself (GET /api/agencies/public/:slug) and its
 * listings (GET /api/properties?agencyId=…, which defaults to APPROVED only).
 * The profile response carries counts but not the listings, hence the second.
 */
export default function AgencyPublicScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const agencySlug = String(slug ?? "");
  const router = useRouter();
  const tokens = useThemeTokens();
  const { user } = useAuth();

  const { data: agency, isLoading, isError, refetch } = useAgencyBySlug(agencySlug);

  // Held until the agency id resolves, so we never issue an unfiltered fetch.
  const listingsQuery = useProperties(
    { agencyId: agency?.id, limit: 20 },
    { enabled: !!agency?.id },
  );
  const listings = listingsQuery.data?.properties ?? [];

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

  if (isLoading) {
    return (
      <View className="flex-1 bg-background">
        <Skeleton className="h-36 w-full rounded-none" />
        <View className="gap-4 p-4">
          <View className="flex-row items-center gap-3">
            <Skeleton className="h-20 w-20 rounded-2xl" />
            <View className="flex-1 gap-2">
              <Skeleton className="h-6 w-44" />
              <Skeleton className="h-4 w-28" />
            </View>
          </View>
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </View>
      </View>
    );
  }

  if (isError || !agency) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-background px-8">
        <Building2 size={40} color={tokens.mutedForeground} />
        <Text className="text-center font-jakarta-semibold text-foreground">
          Couldn&apos;t load this agency
        </Text>
        <Text className="text-center text-sm text-muted-foreground">
          It may have been removed, or the link is out of date.
        </Text>
        <Button variant="brand" size="sm" onPress={() => refetch()}>
          Retry
        </Button>
        <Button variant="ghost" size="sm" onPress={() => router.back()}>
          Go back
        </Button>
      </View>
    );
  }

  const initials = agency.name.slice(0, 2).toUpperCase();

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* Cover banner (DB coverUrl, mapped to bannerUrl by the backend) */}
        <View className="h-36 w-full bg-muted">
          {agency.bannerUrl ? (
            <AppImage
              source={{ uri: resolveImageUrl(agency.bannerUrl) }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              recyclingKey={agency.id}
            />
          ) : null}
        </View>

        <FadeInView className="gap-4 p-4">
          {/* Identity */}
          <View className="flex-row items-center gap-3">
            <Avatar alt={agency.name} className="h-20 w-20 rounded-2xl">
              {agency.logoUrl ? (
                <AvatarImage source={{ uri: resolveImageUrl(agency.logoUrl) }} />
              ) : null}
              <AvatarFallback>
                <Text className="text-lg font-jakarta-bold text-muted-foreground">{initials}</Text>
              </AvatarFallback>
            </Avatar>
            <View className="flex-1 gap-1">
              <Text className="text-xl font-jakarta-extrabold text-foreground" numberOfLines={2}>
                {agency.name}
              </Text>
              <Text className="text-xs text-muted-foreground">@{agency.slug}</Text>
            </View>
          </View>

          {agency.description ? (
            <Text className="text-sm leading-5 text-muted-foreground">{agency.description}</Text>
          ) : null}

          {/* Stats — straight from the profile response's counts */}
          <View className="flex-row gap-2">
            <Stat
              icon={<Home size={16} color={tokens.brand} />}
              value={agency.totalListings}
              label="Listings"
            />
            <Stat
              icon={<CheckCircle2 size={16} color={tokens.brand} />}
              value={agency.soldListings}
              label="Sold"
            />
            <Stat
              icon={<Users size={16} color={tokens.brand} />}
              value={agency.happyClients}
              label="Clients"
            />
          </View>

          <Separator />

          {/* Listings */}
          <Text className="font-jakarta-bold text-foreground">Listings</Text>

          {listingsQuery.isLoading ? (
            <View className="py-6">
              <ActivityIndicator color={tokens.brand} />
            </View>
          ) : listings.length === 0 ? (
            <Text className="text-sm text-muted-foreground">
              This agency has no published listings right now.
            </Text>
          ) : (
            <View className="gap-4">
              {listings.map((p) => (
                <PropertyCard
                  key={p.id}
                  property={p}
                  isSaved={savedMap.has(p.id)}
                  onToggleSave={onToggleSave}
                />
              ))}
            </View>
          )}
        </FadeInView>
      </ScrollView>
    </View>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <View className="flex-1 items-center gap-1 rounded-xl border border-border bg-card py-3">
      {icon}
      <Text className="text-lg font-jakarta-extrabold text-foreground">{value}</Text>
      <Text className="text-xs text-muted-foreground">{label}</Text>
    </View>
  );
}
