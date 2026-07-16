import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Bath, BedDouble, CalendarDays, Eye, Heart, MapPin, Maximize } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  FadeInView,
  Separator,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Skeleton,
  Text,
} from "@/components/ui";
import { MessageButton } from "@/features/chat/MessageButton";
import { FullscreenGallery } from "@/features/property/FullscreenGallery";
import { ImageCarousel } from "@/features/property/ImageCarousel";
import { InquiryForm } from "@/features/property/InquiryForm";
// MAP DISABLED for now — re-enable this import together with the mini-map block below.
// import { PropertyMap } from "@/features/property/PropertyMap";
import { useAuth } from "@/context/AuthContext";
import { usePropertyBySlug } from "@/hooks/usePropertyBySlug";
import { useSavedProperties, useToggleSaveProperty } from "@/hooks/useSavedProperties";
import { formatOmr } from "@/constants/locale";
import { haptics } from "@/lib/haptics";
import { addRecentlyViewed } from "@/lib/recently-viewed";
import { resolveImageUrl } from "@/lib/utils";
import { useThemeTokens } from "@/theme/theme-provider";
import type { ApiProperty } from "@/types/api";

export default function PropertyDetailScreen() {
  const params = useLocalSearchParams<{ slug: string }>();
  const slug = String(params.slug ?? "");
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tokens = useThemeTokens();
  const { user } = useAuth();

  const { data: property, isLoading, isError, refetch } = usePropertyBySlug(slug);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [inquireOpen, setInquireOpen] = useState(false);

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

  // Track recently viewed once the property loads.
  useEffect(() => {
    if (property) addRecentlyViewed(property as ApiProperty);
  }, [property]);

  if (isLoading) return <DetailSkeleton />;

  if (isError || !property) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-background px-8">
        <Text className="text-center font-jakarta-semibold text-foreground">
          Couldn&apos;t load this property
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

  const images = property.images.map((i) => i.url);
  const isSaved = savedMap.has(property.id);
  // MAP DISABLED for now — re-enable with the mini-map block below.
  // const hasCoords = typeof property.latitude === "number" && typeof property.longitude === "number";
  const owner = property.agencyMember ?? property.generalUser;
  const ownerUser = owner?.user;
  const ownerName = ownerUser ? `${ownerUser.firstName} ${ownerUser.lastName}`.trim() : "Owner";
  const ownerRole = property.agencyMember ? property.agencyMember.agency.name : "Property owner";
  // Offer chat to everyone except the listing's own owner (can't message yourself).
  const canMessageOwner = !!ownerUser?.id && ownerUser.id !== user?.userId;

  const onToggleSave = () => {
    haptics.light();
    if (!user) {
      toast("Sign in to save properties");
      return;
    }
    const savedId = savedMap.get(property.id);
    if (savedId) remove.mutate(savedId, { onError: () => toast.error("Couldn't update saved") });
    else save.mutate(property.id, { onError: () => toast.error("Saving is unavailable right now") });
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
        {/* Gallery */}
        <View>
          <ImageCarousel
            images={images}
            height={320}
            onImagePress={(i) => {
              setGalleryIndex(i);
              setGalleryOpen(true);
            }}
          />
          <Pressable
            onPress={() => router.back()}
            accessibilityLabel="Back"
            style={{ top: insets.top + 8 }}
            className="absolute left-4 h-11 w-11 items-center justify-center rounded-full bg-black/40 active:bg-black/55"
          >
            <ArrowLeft size={22} color="#ffffff" />
          </Pressable>
          <Pressable
            onPress={onToggleSave}
            accessibilityLabel={isSaved ? "Remove from saved" : "Save property"}
            style={{ top: insets.top + 8 }}
            className="absolute right-4 h-11 w-11 items-center justify-center rounded-full bg-black/40 active:bg-black/55"
          >
            <Heart size={22} color={isSaved ? tokens.destructive : "#ffffff"} fill={isSaved ? tokens.destructive : "transparent"} />
          </Pressable>
          <View className="absolute bottom-3 left-4 flex-row gap-1.5">
            {property.isFeatured ? <Badge variant="brand">Featured</Badge> : null}
            <Badge variant="secondary">{property.listingType === "SALE" ? "For Sale" : "For Rent"}</Badge>
          </View>
        </View>

        <View className="gap-4 p-4">
          {/* Price + title */}
          <FadeInView className="gap-1">
            <Text className="text-2xl font-jakarta-extrabold text-brand">
              {formatOmr(property.price, property.currency, property.listingType)}
            </Text>
            <Text className="text-xl font-jakarta-bold text-foreground">{property.propertyName}</Text>
            <View className="flex-row items-center gap-1.5">
              <MapPin size={14} color={tokens.mutedForeground} />
              <Text className="flex-1 text-sm text-muted-foreground">
                {[property.address, property.city, property.state].filter(Boolean).join(", ")}
              </Text>
            </View>
            <View className="mt-1 flex-row items-center gap-1.5">
              <Eye size={14} color={tokens.mutedForeground} />
              <Text className="text-xs text-muted-foreground">{property.viewCount} views</Text>
            </View>
          </FadeInView>

          <Separator />

          {/* Specs */}
          <View className="flex-row flex-wrap gap-x-6 gap-y-2">
            {property.bedrooms != null ? <Spec icon={<BedDouble size={18} color={tokens.brand} />} label={`${property.bedrooms} Beds`} /> : null}
            {property.bathrooms != null ? <Spec icon={<Bath size={18} color={tokens.brand} />} label={`${property.bathrooms} Baths`} /> : null}
            {property.areaSqm != null ? <Spec icon={<Maximize size={18} color={tokens.brand} />} label={`${property.areaSqm} m²`} /> : null}
            {property.yearBuilt != null ? <Spec icon={<CalendarDays size={18} color={tokens.brand} />} label={`Built ${property.yearBuilt}`} /> : null}
          </View>

          {/* Mini map — MAP DISABLED for now. To re-enable: uncomment the PropertyMap
              import and `hasCoords` above, then uncomment this block.
          {hasCoords ? (
            <View className="h-44 overflow-hidden rounded-xl border border-border">
              <PropertyMap properties={[property as ApiProperty]} />
            </View>
          ) : null}
          */}

          {/* Description */}
          {property.description ? (
            <View className="gap-1.5">
              <Text className="font-jakarta-semibold text-foreground">About this property</Text>
              <Text className="text-sm leading-5 text-muted-foreground">{property.description}</Text>
            </View>
          ) : null}

          <ChipRow title="Features" items={property.features} />
          <ChipRow title="Amenities" items={property.amenities} />

          {/* Owner / agent */}
          <View className="gap-2">
            <Text className="font-jakarta-semibold text-foreground">Listed by</Text>
            <View className="flex-row items-center gap-3 rounded-xl border border-border bg-card p-3">
              <Avatar alt={ownerName}>
                {ownerUser?.avatarUrl ? (
                  <AvatarImage source={{ uri: resolveImageUrl(ownerUser.avatarUrl) }} />
                ) : null}
                <AvatarFallback>
                  <Text className="font-jakarta-bold text-muted-foreground">
                    {ownerName.slice(0, 2).toUpperCase()}
                  </Text>
                </AvatarFallback>
              </Avatar>
              <View className="flex-1">
                <Text className="font-jakarta-semibold text-foreground">{ownerName}</Text>
                <Text className="text-xs text-muted-foreground">{ownerRole}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom CTAs: Message the owner + Inquire */}
      <View
        style={{ paddingBottom: insets.bottom + 12 }}
        className="absolute inset-x-0 bottom-0 flex-row gap-3 border-t border-border bg-card px-4 pt-3"
      >
        {canMessageOwner && ownerUser ? (
          <MessageButton
            recipientId={ownerUser.id}
            propertyId={property.id}
            variant="outline"
            className="flex-1"
          />
        ) : null}
        <Button variant="brand" className="flex-1" onPress={() => setInquireOpen(true)}>
          Inquire
        </Button>
      </View>

      <FullscreenGallery
        images={images}
        initialIndex={galleryIndex}
        visible={galleryOpen}
        onClose={() => setGalleryOpen(false)}
      />

      <Sheet open={inquireOpen} onOpenChange={setInquireOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Inquire</SheetTitle>
          </SheetHeader>
          {/* Scrolls when the keyboard halves the visible height (SheetContent
              lets it shrink); keyboardShouldPersistTaps so "Send inquiry" works
              on the first tap while the keyboard is open. */}
          <ScrollView
            className="mt-3"
            style={{ flexShrink: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <InquiryForm
              propertyId={property.id}
              defaultEmail={user?.email}
              onDone={() => setInquireOpen(false)}
            />
          </ScrollView>
        </SheetContent>
      </Sheet>
    </View>
  );
}

function Spec({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View className="flex-row items-center gap-2">
      {icon}
      <Text className="text-sm font-jakarta-medium text-foreground">{label}</Text>
    </View>
  );
}

function ChipRow({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <View className="gap-2">
      <Text className="font-jakarta-semibold text-foreground">{title}</Text>
      <View className="flex-row flex-wrap gap-2">
        {items.map((it) => (
          <Badge key={it} variant="secondary">
            {it}
          </Badge>
        ))}
      </View>
    </View>
  );
}

function DetailSkeleton() {
  return (
    <View className="flex-1 bg-background">
      <Skeleton className="h-80 w-full rounded-none" />
      <View className="gap-3 p-4">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="mt-2 h-44 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </View>
    </View>
  );
}
