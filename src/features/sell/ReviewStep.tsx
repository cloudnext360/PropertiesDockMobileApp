import { Pencil } from "lucide-react-native";
import { Pressable, ScrollView, View } from "react-native";

import { AppImage } from "@/components/ui/image";
import { Text } from "@/components/ui";
import { PROPERTY_TYPES, type FormState, type StepKey } from "@/taxonomy/property";
import { useThemeTokens } from "@/theme/theme-provider";
import { StepHeader } from "./ui";

function Section({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  const tokens = useThemeTokens();
  return (
    <View className="rounded-2xl border border-border bg-card p-4">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="font-jakarta-bold text-foreground">{title}</Text>
        <Pressable
          onPress={onEdit}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${title}`}
          className="flex-row items-center gap-1"
        >
          <Pencil size={13} color={tokens.brand} />
          <Text className="text-xs font-jakarta-semibold text-brand">Edit</Text>
        </Pressable>
      </View>
      <View className="gap-2">{children}</View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-3">
      <Text className="text-sm text-muted-foreground">{label}</Text>
      <Text className="flex-1 text-right text-sm font-jakarta-medium text-foreground">
        {value || "—"}
      </Text>
    </View>
  );
}

export function ReviewStep({
  form,
  setStep,
}: {
  form: FormState;
  setStep: (step: StepKey) => void;
}) {
  const subtypeLabel =
    (form.majorType &&
      PROPERTY_TYPES[form.category][form.majorType]?.find((s) => s.value === form.subtype)
        ?.label) ||
    form.subtype;

  const priceDisplay = form.price ? `OMR ${Number(form.price).toLocaleString()}` : "—";

  return (
    <View className="gap-4">
      <StepHeader
        title="Review your listing"
        subtitle="Double-check everything — your listing goes live as soon as it's submitted."
      />

      <Section title="Basics" onEdit={() => setStep("basics")}>
        <Row label="Name" value={form.name} />
        <Row label="Category" value={form.category} />
        <Row label="Type" value={form.majorType} />
        <Row label="Subtype" value={subtypeLabel} />
        <Row label="Listing" value={`For ${form.type}`} />
        {form.category === "Residential" ? (
          <>
            <Row label="Bedrooms" value={form.beds} />
            <Row label="Bathrooms" value={form.baths} />
          </>
        ) : null}
      </Section>

      <Section title="Location" onEdit={() => setStep("location")}>
        <Row label="Address" value={form.address} />
        <Row label="Block" value={form.block} />
        <Row label="City" value={form.city} />
        <Row label="Postal code" value={form.postalCode} />
        <Row label="State" value={form.state} />
        <Row label="Country" value={form.country} />
      </Section>

      <Section title="Details & pricing" onEdit={() => setStep("details")}>
        <Row label="Price" value={priceDisplay + (form.negotiable ? " (negotiable)" : "")} />
        <Row label="Area" value={form.area ? `${form.area} sq. ft.` : ""} />
        <Row label="Year built" value={form.yearBuilt} />
        <Row
          label="Amenities"
          value={form.amenities.length ? `${form.amenities.length} selected` : "None"}
        />
        <Row
          label="Features"
          value={form.features.length ? `${form.features.length} selected` : "None"}
        />
        <View className="mt-1">
          <Text className="text-sm text-muted-foreground">Description</Text>
          <Text className="mt-1 text-sm leading-5 text-foreground">{form.description}</Text>
        </View>
      </Section>

      <Section title={`Photos (${form.imageFiles.length})`} onEdit={() => setStep("photos")}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {form.imageFiles.map((img, index) => (
              <View key={`${img.uri}-${index}`} className="relative">
                <AppImage
                  source={{ uri: img.uri }}
                  contentFit="cover"
                  style={{ width: 88, height: 88, borderRadius: 10 }}
                />
                {index === 0 ? (
                  <View className="absolute bottom-1 left-1 rounded-md bg-brand px-1.5 py-0.5">
                    <Text className="text-[10px] font-jakarta-bold text-brand-foreground">
                      Cover
                    </Text>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        </ScrollView>
      </Section>
    </View>
  );
}
