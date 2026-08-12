import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { BadgeCheck, Building2, CalendarDays, Mail, Phone } from "lucide-react-native";
import { useCallback, useMemo } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { toast } from "sonner-native";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  FadeInView,
  Separator,
  Skeleton,
  Text,
} from "@/components/ui";
import { MessageButton } from "@/features/chat/MessageButton";
import { PropertyCard } from "@/features/property/PropertyCard";
import { useAuth } from "@/context/AuthContext";
import { usePublicUser } from "@/hooks/usePublicUser";
import { useSavedProperties, useToggleSaveProperty } from "@/hooks/useSavedProperties";
import { resolveImageUrl } from "@/lib/utils";
import { useThemeTokens } from "@/theme/theme-provider";
import type { ApiProperty } from "@/types/api";

/**
 * Public user profile — the target of the "Listed by" card on a property detail
 * screen, and of the /users/:id deep link.
 *
 * Backed by GET /api/users/:id, which already restricts the listings it returns
 * to APPROVED, so nothing archived shows up here.
 */
export default function PublicUserScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = String(id ?? "");
  const router = useRouter();
  const tokens = useThemeTokens();
  const { user } = useAuth();

  const { data: profile, isLoading, isError, refetch } = usePublicUser(userId);

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

  // Can't message yourself.
  const canMessage = !!userId && userId !== user?.userId;

  if (isLoading) {
    return (
      <View className="flex-1 bg-background">
        {/* {header} */}
        <View className="gap-4 p-4">
          <View className="flex-row items-center gap-3">
            <Skeleton className="h-20 w-20 rounded-full" />
            <View className="flex-1 gap-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-28" />
            </View>
          </View>
          <Skeleton className="h-11 w-full rounded-md" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </View>
      </View>
    );
  }

  if (isError || !profile) {
    return (
      <View className="flex-1 bg-background">
        {/* {header} */}
        <View className="flex-1 items-center justify-center gap-3 px-8">
          <Text className="text-center font-jakarta-semibold text-foreground">
            Couldn&apos;t load this profile
          </Text>
          <Button variant="brand" size="sm" onPress={() => refetch()}>
            Retry
          </Button>
          <Button variant="ghost" size="sm" onPress={() => router.back()}>
            Go back
          </Button>
        </View>
      </View>
    );
  }

  const fullName = `${profile.firstName} ${profile.lastName}`.trim() || "User";
  const initials = fullName.slice(0, 2).toUpperCase();
  const memberSince = new Date(profile.createdAt).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
  const bio = profile.generalUser?.bio ?? null;
  const listings = profile.properties ?? [];
  const memberships = profile.agencyMemberships ?? [];

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <FadeInView className="gap-4 p-4">
          {/* Identity */}
          <View className="flex-row items-center gap-3">
            <Avatar alt={fullName} className="h-20 w-20">
              {profile.avatarUrl ? (
                <AvatarImage source={{ uri: resolveImageUrl(profile.avatarUrl) }} />
              ) : null}
              <AvatarFallback>
                <Text className="text-lg font-jakarta-bold text-muted-foreground">{initials}</Text>
              </AvatarFallback>
            </Avatar>
            <View className="flex-1 gap-1">
              <View className="flex-row items-center gap-1.5">
                <Text
                  className="flex-1 text-xl font-jakarta-extrabold text-foreground"
                  numberOfLines={2}
                >
                  {fullName}
                </Text>
                {profile.isVerified ? <BadgeCheck size={18} color={tokens.brand} /> : null}
              </View>
              <View className="flex-row items-center gap-1.5">
                <CalendarDays size={13} color={tokens.mutedForeground} />
                <Text className="text-xs text-muted-foreground">Member since {memberSince}</Text>
              </View>
            </View>
          </View>

          {bio ? <Text className="text-sm leading-5 text-muted-foreground">{bio}</Text> : null}

          {/* Agencies this user belongs to — tapping opens the agency page */}
          {memberships.length > 0 ? (
            <View className="gap-2">
              {memberships.map((m) => (
                <Pressable
                  key={m.id}
                  onPress={() =>
                    // Object form (not a template string) so the slug is encoded
                    // as a route param — a raw interpolation breaks the match if
                    // the slug ever contains a space or slash.
                    router.push({
                      pathname: "/agency/[slug]",
                      params: { slug: m.agency.slug },
                    } as unknown as Href)
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${m.agency.name}`}
                  className="flex-row items-center gap-2 rounded-xl border border-border bg-card p-3 active:bg-muted"
                >
                  <Building2 size={16} color={tokens.brand} />
                  <Text className="flex-1 font-jakarta-semibold text-foreground" numberOfLines={1}>
                    {m.agency.name}
                  </Text>
                  <Badge variant="secondary">{m.role.replace("_", " ")}</Badge>
                </Pressable>
              ))}
            </View>
          ) : null}

          {/* Contact — only present when the user's privacy settings allow it */}
          {profile.email || profile.phone ? (
            <View className="gap-2 rounded-xl border border-border bg-card p-3">
              {profile.email ? (
                <View className="flex-row items-center gap-2">
                  <Mail size={14} color={tokens.mutedForeground} />
                  <Text className="flex-1 text-sm text-foreground" numberOfLines={1}>
                    {profile.email}
                  </Text>
                </View>
              ) : null}
              {profile.phone ? (
                <View className="flex-row items-center gap-2">
                  <Phone size={14} color={tokens.mutedForeground} />
                  <Text className="flex-1 text-sm text-foreground" numberOfLines={1}>
                    {profile.phone}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {canMessage ? <MessageButton recipientId={userId} variant="brand" /> : null}

          <Separator />

          {/* Their live listings */}
          <Text className="font-jakarta-bold text-foreground">
            {listings.length === 0
              ? "No active listings"
              : `${listings.length} active listing${listings.length === 1 ? "" : "s"}`}
          </Text>

          {listings.length === 0 ? (
            <Text className="text-sm text-muted-foreground">
              This user doesn&apos;t have any published properties right now.
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
