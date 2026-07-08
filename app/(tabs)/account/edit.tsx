import { zodResolver } from "@hookform/resolvers/zod";
import { useHeaderHeight } from "@react-navigation/elements";
import { useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { toast } from "sonner-native";

import { Button, Input, Label, Text, Textarea } from "@/components/ui";
import { PHONE_PLACEHOLDER } from "@/constants/locale";
import { EditProfileSchema, type EditProfileForm } from "@/features/account/schemas";
import { useFullProfile } from "@/hooks/useFullProfile";
import { useUpdateProfile } from "@/hooks/useUpdateProfile";

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <View className="gap-1.5">
      <Label>{label}</Label>
      {children}
      {error ? <Text className="text-xs text-destructive">{error}</Text> : null}
    </View>
  );
}

export default function EditProfileScreen() {
  const router = useRouter();
  // Offsets the account stack's native header so the keyboard padding isn't
  // short by the header height (same fix as ListPropertyWizard).
  const headerHeight = useHeaderHeight();
  const { data: profile } = useFullProfile();
  const update = useUpdateProfile();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<EditProfileForm>({
    resolver: zodResolver(EditProfileSchema),
    values: {
      firstName: profile?.firstName ?? "",
      lastName: profile?.lastName ?? "",
      phone: profile?.phone ?? "",
      bio: profile?.bio ?? "",
    },
  });

  const onSubmit = handleSubmit((v) => {
    update.mutate(
      {
        firstName: v.firstName,
        lastName: v.lastName,
        phone: v.phone?.trim() ? v.phone.trim() : undefined,
        bio: v.bio ?? "",
      },
      {
        onSuccess: () => {
          toast.success("Profile updated");
          router.back();
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
      },
    );
  });

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={headerHeight}
    >
      <ScrollView contentContainerClassName="gap-4 p-4 pb-10" keyboardShouldPersistTaps="handled">
        <Field label="First name" error={errors.firstName?.message}>
          <Controller
            control={control}
            name="firstName"
            render={({ field }) => <Input value={field.value} onChangeText={field.onChange} />}
          />
        </Field>
        <Field label="Last name" error={errors.lastName?.message}>
          <Controller
            control={control}
            name="lastName"
            render={({ field }) => <Input value={field.value} onChangeText={field.onChange} />}
          />
        </Field>
        <Field label="Phone" error={errors.phone?.message}>
          <Controller
            control={control}
            name="phone"
            render={({ field }) => (
              <Input
                keyboardType="phone-pad"
                placeholder={PHONE_PLACEHOLDER}
                value={field.value ?? ""}
                onChangeText={field.onChange}
              />
            )}
          />
        </Field>
        <Field label="Bio" error={errors.bio?.message}>
          <Controller
            control={control}
            name="bio"
            render={({ field }) => (
              <Textarea
                className="min-h-28"
                placeholder="Tell others about yourself…"
                value={field.value ?? ""}
                onChangeText={field.onChange}
              />
            )}
          />
        </Field>

        <Button variant="brand" loading={update.isPending} onPress={onSubmit}>
          Save changes
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
