import { Bell, Eye, EyeOff, Lock, Moon, Palette, Shield, Smartphone, Sun } from "lucide-react-native";
import { useState, type ComponentType } from "react";
import { ActivityIndicator, Pressable, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { toast } from "sonner-native";

import { Button, Switch, Text } from "@/components/ui";
import { useChangePassword } from "@/hooks/useChangePassword";
import { useUpdateUserSettings, useUserSettings } from "@/hooks/useUserSettings";
import {
  useThemePreference,
  useThemeTokens,
  type ThemePreference,
} from "@/theme/theme-provider";

type IconType = ComponentType<{ size?: number; color?: string }>;

/** A titled card grouping related setting rows. */
function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: IconType;
  children: React.ReactNode;
}) {
  const tokens = useThemeTokens();
  return (
    <View className="rounded-2xl border border-border bg-card p-4">
      <View className="mb-3 flex-row items-center gap-2">
        <Icon size={16} color={tokens.brand} />
        <Text className="text-xs font-jakarta-bold uppercase tracking-wider text-muted-foreground">
          {title}
        </Text>
      </View>
      <View>{children}</View>
    </View>
  );
}

/** A label + description on the left, a Switch on the right. */
function ToggleRow({
  label,
  desc,
  value,
  onValueChange,
  last,
}: {
  label: string;
  desc: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <View
      className={
        "flex-row items-center justify-between gap-4 py-3" +
        (last ? "" : " border-b border-border/50")
      }
    >
      <View className="flex-1">
        <Text className="text-sm font-jakarta-semibold text-foreground">{label}</Text>
        <Text className="text-xs text-muted-foreground">{desc}</Text>
      </View>
      <Switch checked={value} onCheckedChange={onValueChange} />
    </View>
  );
}

/** Password input with a show/hide eye toggle. */
function PasswordField({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
}) {
  const tokens = useThemeTokens();
  const [show, setShow] = useState(false);
  return (
    <View className="gap-1.5">
      <Text className="text-xs font-jakarta-medium text-muted-foreground">{label}</Text>
      <View className="h-11 flex-row items-center rounded-md border border-input bg-background px-3">
        <TextInput
          className="h-full flex-1 text-base text-foreground"
          secureTextEntry={!show}
          autoCapitalize="none"
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor={tokens.mutedForeground}
        />
        <Pressable onPress={() => setShow((s) => !s)} hitSlop={8} accessibilityRole="button">
          {show ? (
            <EyeOff size={18} color={tokens.mutedForeground} />
          ) : (
            <Eye size={18} color={tokens.mutedForeground} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

/**
 * Appearance card — Light / Dark / System.
 *
 * Stored on the device (AsyncStorage), not on the account: it's a per-device
 * preference, and it must apply before any authenticated request resolves.
 */
function AppearanceCard() {
  const tokens = useThemeTokens();
  const { preference, setPreference } = useThemePreference();

  const options: { value: ThemePreference; label: string; icon: IconType }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Smartphone },
  ];

  return (
    <Section title="Appearance" icon={Palette}>
      <View className="gap-3 py-1">
        <View className="flex-row gap-2">
          {options.map(({ value, label, icon: Icon }) => {
            const selected = preference === value;
            return (
              <Pressable
                key={value}
                onPress={() => setPreference(value)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`${label} theme`}
                className={
                  "flex-1 items-center gap-1.5 rounded-xl border-2 py-3 " +
                  (selected ? "border-brand bg-brand" : "border-border bg-card")
                }
              >
                <Icon size={18} color={selected ? tokens.brandForeground : tokens.mutedForeground} />
                <Text
                  className={
                    "text-xs font-jakarta-bold " +
                    (selected ? "text-brand-foreground" : "text-muted-foreground")
                  }
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text className="text-xs text-muted-foreground">
          {preference === "system"
            ? "Follows your device's light or dark setting."
            : `Always use the ${preference} theme, regardless of your device setting.`}
        </Text>
      </View>
    </Section>
  );
}

/** Change-password card — validates against the backend's password rules. */
function ChangePasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const changePassword = useChangePassword();

  const submit = () => {
    setError("");
    if (!current) return setError("Enter your current password.");
    if (next.length < 8) return setError("New password must be at least 8 characters.");
    if (!/[A-Z]/.test(next)) return setError("New password needs an uppercase letter.");
    if (!/[0-9]/.test(next)) return setError("New password needs a number.");
    if (next !== confirm) return setError("New passwords do not match.");

    changePassword.mutate(
      { currentPassword: current, newPassword: next },
      {
        onSuccess: () => {
          setCurrent("");
          setNext("");
          setConfirm("");
          toast.success("Password changed. Other devices have been signed out.");
        },
        onError: (err) =>
          setError(err instanceof Error ? err.message : "Couldn't change password."),
      },
    );
  };

  return (
    <Section title="Change password" icon={Lock}>
      <View className="gap-3">
        <PasswordField label="Current password" value={current} onChangeText={setCurrent} />
        <PasswordField label="New password" value={next} onChangeText={setNext} />
        <PasswordField label="Confirm new password" value={confirm} onChangeText={setConfirm} />
        {error ? <Text className="text-xs text-destructive">{error}</Text> : null}
        <Button
          variant="brand"
          className="mt-1"
          loading={changePassword.isPending}
          onPress={submit}
        >
          Update password
        </Button>
      </View>
    </Section>
  );
}

/**
 * Account Settings body (rendered inside AccountShell). Privacy + notification
 * toggles persist to GET/PUT /api/users/settings (optimistic); the security card
 * changes the password. Profile name/avatar edits live on /account/edit.
 */
export function SettingsPanel() {
  const tokens = useThemeTokens();
  const { data: settings, isLoading } = useUserSettings();
  const update = useUpdateUserSettings();

  // Optimistic hook → just fire; surface a toast if the server rejects it.
  const save = (payload: Parameters<typeof update.mutate>[0]) =>
    update.mutate(payload, { onError: () => toast.error("Couldn't save that setting.") });

  return (
    <KeyboardAwareScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      bottomOffset={20}
      contentContainerStyle={{ gap: 16, paddingHorizontal: 16, paddingBottom: 40 }}
    >
      {/* Device-local, so it renders immediately — it used to sit behind the
          settings fetch, which also meant a failed fetch left the whole screen
          stuck on a spinner with no way to reach any of it. */}
      <AppearanceCard />

      {isLoading || !settings ? (
        <View className="items-center justify-center py-10">
          <ActivityIndicator size="large" color={tokens.brand} />
        </View>
      ) : (
        <>
          <Section title="Notifications" icon={Bell}>
            <ToggleRow
              label="Email alerts"
              desc="Inquiries, listings and account updates by email"
              value={settings.emailNotifications}
              onValueChange={(v) => save({ emailNotifications: v })}
            />
            <ToggleRow
              label="Push alerts"
              desc="Real-time alerts for messages and listing activity"
              value={settings.pushNotifications}
              onValueChange={(v) => save({ pushNotifications: v })}
            />
            <ToggleRow
              label="SMS alerts"
              desc="Text messages for urgent updates"
              value={settings.smsNotifications}
              onValueChange={(v) => save({ smsNotifications: v })}
              last
            />
          </Section>

          <Section title="Privacy" icon={Shield}>
            <ToggleRow
              label="Public profile"
              desc="Allow anyone to discover and view your profile"
              value={settings.profileVisibility === "public"}
              onValueChange={(v) => save({ profileVisibility: v ? "public" : "private" })}
            />
            <ToggleRow
              label="Show phone number"
              desc="Display your phone on your public profile"
              value={settings.showPhone}
              onValueChange={(v) => save({ showPhone: v })}
            />
            <ToggleRow
              label="Show email"
              desc="Display your email on your public profile"
              value={settings.showEmail}
              onValueChange={(v) => save({ showEmail: v })}
              last
            />
          </Section>
        </>
      )}

      <ChangePasswordCard />
    </KeyboardAwareScrollView>
  );
}
