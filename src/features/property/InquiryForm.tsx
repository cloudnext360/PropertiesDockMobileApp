import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";
import { toast } from "sonner-native";

import { Button, Input, Label, Text, Textarea } from "@/components/ui";
import { PHONE_PLACEHOLDER } from "@/constants/locale";
import { InquirySchema, type InquiryForm as InquiryFormValues } from "@/features/property/schemas";
import { useCreateInquiry } from "@/hooks/useCreateInquiry";
import { haptics } from "@/lib/haptics";

interface InquiryFormProps {
  propertyId: string;
  defaultName?: string;
  defaultEmail?: string;
  onDone: () => void;
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-1.5">
      <Label>{label}</Label>
      {children}
      {error ? <Text className="text-xs text-destructive">{error}</Text> : null}
    </View>
  );
}

export function InquiryForm({ propertyId, defaultName, defaultEmail, onDone }: InquiryFormProps) {
  const mutation = useCreateInquiry();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<InquiryFormValues>({
    resolver: zodResolver(InquirySchema),
    defaultValues: {
      name: defaultName ?? "",
      email: defaultEmail ?? "",
      phone: "",
      message: "I'm interested in this property. Please share more details.",
    },
  });

  const onSubmit = handleSubmit((values) => {
    mutation.mutate(
      { propertyId, ...values },
      {
        onSuccess: () => {
          haptics.success();
          toast.success("Inquiry sent", { description: "The owner will get back to you." });
          onDone();
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to send inquiry"),
      },
    );
  });

  return (
    <View className="gap-3">
      <Field label="Name" error={errors.name?.message}>
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <Input placeholder="Your name" value={field.value} onChangeText={field.onChange} />
          )}
        />
      </Field>

      <Field label="Email" error={errors.email?.message}>
        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <Input
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={field.value}
              onChangeText={field.onChange}
            />
          )}
        />
      </Field>

      <Field label="Phone (optional)" error={errors.phone?.message}>
        <Controller
          control={control}
          name="phone"
          render={({ field }) => (
            <Input
              placeholder={PHONE_PLACEHOLDER}
              keyboardType="phone-pad"
              value={field.value ?? ""}
              onChangeText={field.onChange}
            />
          )}
        />
      </Field>

      <Field label="Message" error={errors.message?.message}>
        <Controller
          control={control}
          name="message"
          render={({ field }) => (
            <Textarea value={field.value} onChangeText={field.onChange} className="min-h-28" />
          )}
        />
      </Field>

      <Button variant="brand" loading={mutation.isPending} onPress={onSubmit}>
        Send inquiry
      </Button>
    </View>
  );
}
