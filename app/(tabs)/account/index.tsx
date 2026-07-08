import { useRouter, type Href } from "expo-router";
import {
  BadgeCheck,
  Building2,
  ChevronRight,
  Coins,
  Heart,
  LogOut,
  MessageSquare,
  Pencil,
  Settings,
} from "lucide-react-native";
import type { ComponentType } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { Avatar, AvatarFallback, AvatarImage, Button, Separator, Text } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useCreditWallet } from "@/hooks/useCreditWallet";
import { useFullProfile } from "@/hooks/useFullProfile";
import { resolveImageUrl } from "@/lib/utils";
import { useThemeTokens } from "@/theme/theme-provider";

type IconType = ComponentType<{ size?: number; color?: string }>;

const MENU: { icon: IconType; label: string; href: Href }[] = [
  { icon: Building2, label: "My Listings", href: "/account/listings" },
  { icon: MessageSquare, label: "Inquiries", href: "/account/inquiries" },
  { icon: Heart, label: "Saved Properties", href: "/account/saved-properties" },
  { icon: Settings, label: "Settings", href: "/account/settings" },
  { icon: BadgeCheck, label: "Verification", href: "/account/verification" },
];

function MenuRow({ icon: Icon, label, onPress }: { icon: IconType; label: string; onPress: () => void }) {
  const tokens = useThemeTokens();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="flex-row items-center gap-3 rounded-lg border border-border bg-card px-4 py-3.5 active:opacity-70"
    >
      <Icon size={20} color={tokens.brand} />
      <Text className="flex-1 font-jakarta-medium text-foreground">{label}</Text>
      <ChevronRight size={18} color={tokens.mutedForeground} />
    </Pressable>
  );
}

export default function AccountHome() {
  const router = useRouter();
  const tokens = useThemeTokens();
  const { user, logout } = useAuth();
  const { data: profile } = useFullProfile();
  const { data: wallet } = useCreditWallet();

  const name = profile ? `${profile.firstName} ${profile.lastName}`.trim() : (user?.email ?? "");
  const initials = (name || user?.email || "PD").slice(0, 2).toUpperCase();
  const avatarUrl = profile?.avatarUrl ? resolveImageUrl(profile.avatarUrl) : null;

  const onSignOut = async () => {
    await logout();
    router.replace("/");
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerClassName="gap-3 p-4 pb-8">
        {/* Profile header */}
        <View className="flex-row items-center gap-3 rounded-xl border border-border bg-card p-4">
          <Avatar alt={name} className="h-16 w-16">
            {avatarUrl ? <AvatarImage source={{ uri: avatarUrl }} /> : null}
            <AvatarFallback>
              <Text className="text-lg font-jakarta-bold text-muted-foreground">{initials}</Text>
            </AvatarFallback>
          </Avatar>
          <View className="flex-1">
            <Text className="text-lg font-jakarta-bold text-foreground" numberOfLines={1}>
              {name || "Your account"}
            </Text>
            <Text className="text-xs text-muted-foreground" numberOfLines={1}>
              {profile?.email ?? user?.email}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/account/edit")}
            hitSlop={8}
            accessibilityLabel="Edit profile"
            className="h-11 w-11 items-center justify-center rounded-full border border-border active:bg-muted"
          >
            <Pencil size={18} color={tokens.foreground} />
          </Pressable>
        </View>

        {/* Credit wallet summary */}
        <View className="flex-row items-center gap-3 rounded-xl border border-border bg-card p-4">
          <View className="h-11 w-11 items-center justify-center rounded-full bg-brand/10">
            <Coins size={20} color={tokens.brand} />
          </View>
          <View className="flex-1">
            <Text className="text-xs text-muted-foreground">Credit balance</Text>
            <Text className="text-xl font-jakarta-extrabold text-foreground">
              {wallet?.balance ?? 0} <Text className="text-sm font-jakarta-medium text-muted-foreground">credits</Text>
            </Text>
          </View>
        </View>

        <Separator className="my-1" />

        {MENU.map((item) => (
          <MenuRow key={item.label} icon={item.icon} label={item.label} onPress={() => router.push(item.href)} />
        ))}

        <Button variant="outline" className="mt-2" onPress={onSignOut}>
          <View className="flex-row items-center gap-2">
            <LogOut size={16} color={tokens.destructive} />
            <Text className="font-jakarta-semibold text-destructive">Sign out</Text>
          </View>
        </Button>
      </ScrollView>
    </View>
  );
}
