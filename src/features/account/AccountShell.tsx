import { useRouter, type Href } from "expo-router";
import { Building2, Coins, Heart, LogOut, MessageSquare, Pencil, Settings } from "lucide-react-native";
import type { ComponentType, ReactNode } from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar, AvatarFallback, AvatarImage, Text } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useCreditWallet } from "@/hooks/useCreditWallet";
import { useFullProfile } from "@/hooks/useFullProfile";
import { cn, resolveImageUrl } from "@/lib/utils";
import { useThemeTokens } from "@/theme/theme-provider";

export type AccountTabKey = "listings" | "inquiries" | "saved" | "settings";

type IconType = ComponentType<{ size?: number; color?: string }>;

const TABS: { key: AccountTabKey; icon: IconType; label: string; href: Href }[] = [
  { key: "listings", icon: Building2, label: "Listings", href: "/account/listings" },
  { key: "inquiries", icon: MessageSquare, label: "Inquiries", href: "/account/inquiries" },
  { key: "saved", icon: Heart, label: "Saved", href: "/account/saved-properties" },
  { key: "settings", icon: Settings, label: "Settings", href: "/account/settings" },
];

interface AccountShellProps {
  /** Which of the 4 sub-screens is currently mounted — lights the matching tab. */
  active: AccountTabKey;
  children: ReactNode;
}

/**
 * Shared chrome for the Account section: a pinned profile header + credit
 * wallet, then a segmented tab strip for My Listings / Inquiries / Saved
 * Properties / Settings. Each tab is a real route (account/_layout.tsx hides
 * their native header, so this is the only chrome they get) — switching is a
 * router.replace, not local state, so deep links (push-notification taps into
 * Inquiries, the post-listing redirect into Listings) land with the correct
 * tab already lit.
 */
export function AccountShell({ active, children }: AccountShellProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
    <View className="flex-1 bg-white dark:bg-background">
      <View style={{ paddingTop: insets.top }} className="gap-3 p-4 pb-0">
        {/* Profile header */}
        <View className="flex-row items-center gap-3 rounded-xl border border-border bg-card p-4">
          <Avatar alt={name} className="h-14 w-14">
            {avatarUrl ? <AvatarImage source={{ uri: avatarUrl }} /> : null}
            <AvatarFallback>
              <Text className="text-base font-jakarta-bold text-muted-foreground">{initials}</Text>
            </AvatarFallback>
          </Avatar>
          <View className="flex-1">
            <Text className="text-base font-jakarta-bold text-foreground" numberOfLines={1}>
              {name || "Your account"}
            </Text>
            <Text className="text-xs text-muted-foreground" numberOfLines={1}>
              {profile?.email ?? user?.email}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/account/edit")}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
            className="h-10 w-10 items-center justify-center rounded-full border border-border active:bg-muted"
          >
            <Pencil size={16} color={tokens.foreground} />
          </Pressable>
          <Pressable
            onPress={onSignOut}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            className="h-10 w-10 items-center justify-center rounded-full border border-border active:bg-muted"
          >
            <LogOut size={16} color={tokens.destructive} />
          </Pressable>
        </View>

        {/* Credit wallet summary */}
        {/* <View className="flex-row items-center gap-3 rounded-xl border border-border bg-card p-3.5">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-brand/10">
            <Coins size={18} color={tokens.brand} />
          </View>
          <View className="flex-1">
            <Text className="text-xs text-muted-foreground">Credit balance</Text>
            <Text className="text-base font-jakarta-extrabold text-foreground">
              {wallet?.balance ?? 0}{" "}
              <Text className="text-xs font-jakarta-medium text-muted-foreground">credits</Text>
            </Text>
          </View>
        </View> */}

        {/* Segmented tab strip — My Listings / Inquiries / Saved / Settings */}
        <View className="flex-row rounded-xl bg-muted p-1">
          {TABS.map((tab) => {
            const isActive = tab.key === active;
            const Icon = tab.icon;
            return (
              <Pressable
                key={tab.key}
                onPress={() => !isActive && router.replace(tab.href)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={tab.label}
                className={cn(
                  "flex-1 flex-row items-center justify-center gap-1.5 rounded-lg py-2.5",
                  isActive && "bg-card shadow-sm",
                )}
              >
                <Icon size={15} color={isActive ? tokens.brand : tokens.mutedForeground} />
                <Text
                  className={cn(
                    "text-xs font-jakarta-semibold",
                    isActive ? "text-foreground" : "text-muted-foreground",
                  )}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="flex-1 pt-3">{children}</View>
    </View>
  );
}
