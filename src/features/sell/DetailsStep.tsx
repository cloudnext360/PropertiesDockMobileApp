import { Check, Plus, X } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { Button, Input, Text, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils";
import { AMENITIES, FEATURE_OPTIONS, type StepProps } from "@/taxonomy/property";
import { useThemeTokens } from "@/theme/theme-provider";
import { Field, StepHeader } from "./ui";

const CURRENT_YEAR = new Date().getFullYear();

export function DetailsStep({ form, update, touched }: StepProps) {
  const tokens = useThemeTokens();
  const [customFeature, setCustomFeature] = useState("");

  const err = touched
    ? {
        price: Number(form.price) <= 0 ? "Price must be greater than 0" : "",
        area: Number(form.area) <= 0 ? "Area is required" : "",
        yearBuilt:
          !form.yearBuilt || Number(form.yearBuilt) < 1800 || Number(form.yearBuilt) > CURRENT_YEAR
            ? `Year built must be between 1800 and ${CURRENT_YEAR}`
            : "",
        description: !form.description.trim()
          ? "Description is required"
          : form.description.trim().length < 20
            ? "Description must be at least 20 characters"
            : "",
      }
    : { price: "", area: "", yearBuilt: "", description: "" };

  const toggleAmenity = (label: string) => {
    const next = form.amenities.includes(label)
      ? form.amenities.filter((a) => a !== label)
      : [...form.amenities, label];
    update({ amenities: next });
  };

  const toggleFeature = (feat: string) => {
    const next = form.features.includes(feat)
      ? form.features.filter((f) => f !== feat)
      : [...form.features, feat];
    update({ features: next });
  };

  const addCustomFeature = () => {
    const val = customFeature.trim();
    if (!val || form.features.includes(val)) return;
    update({ features: [...form.features, val] });
    setCustomFeature("");
  };

  const customFeatures = form.features.filter((f) => !FEATURE_OPTIONS.includes(f));

  return (
    <View className="gap-5">
      <StepHeader
        title="Details & pricing"
        subtitle="Set your asking price and describe what makes this property exceptional."
      />

      <View className="flex-row gap-3">
        <View className="flex-1">
          <Field label="Price (OMR)" required error={err.price}>
            <Input
              placeholder="e.g. 120000"
              keyboardType="numeric"
              value={form.price}
              onChangeText={(price) => update({ price })}
            />
          </Field>
        </View>
        <View className="flex-1">
          <Field label="Area (Sq. Ft.)" required error={err.area}>
            <Input
              placeholder="e.g. 6450"
              keyboardType="numeric"
              value={form.area}
              onChangeText={(area) => update({ area })}
            />
          </Field>
        </View>
      </View>

      <Field label="Year Built" required error={err.yearBuilt}>
        <Input
          placeholder={`e.g. ${CURRENT_YEAR}`}
          keyboardType="number-pad"
          maxLength={4}
          value={form.yearBuilt}
          onChangeText={(yearBuilt) => update({ yearBuilt })}
        />
      </Field>

      <Field label="Property Description" required error={err.description}>
        <Textarea
          placeholder="Describe your property — highlight key features, recent upgrades, and what makes it stand out…"
          className="min-h-32"
          value={form.description}
          onChangeText={(description) => update({ description })}
        />
      </Field>

      {/* Negotiable */}
      <Pressable
        onPress={() => update({ negotiable: !form.negotiable })}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: form.negotiable }}
        className="flex-row items-center gap-2.5"
      >
        <View
          className={cn(
            "h-5 w-5 items-center justify-center rounded border-2",
            form.negotiable ? "border-brand bg-brand" : "border-border",
          )}
        >
          {form.negotiable ? <Check size={12} strokeWidth={3} color={tokens.brandForeground} /> : null}
        </View>
        <Text className="text-sm font-jakarta-medium text-muted-foreground">
          Price is negotiable
        </Text>
      </Pressable>

      <View className="h-px bg-border" />

      {/* Amenities */}
      <View className="gap-2">
        <Text className="text-sm font-jakarta-semibold text-foreground">Amenities</Text>
        <View className="flex-row flex-wrap gap-2">
          {AMENITIES.map(({ icon: Icon, label }) => {
            const selected = form.amenities.includes(label);
            return (
              <Pressable
                key={label}
                onPress={() => toggleAmenity(label)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                className={cn(
                  "flex-row items-center gap-1.5 rounded-xl border-2 px-3 py-2",
                  selected ? "border-brand bg-brand/10" : "border-border",
                )}
              >
                <Icon size={14} color={selected ? tokens.brand : tokens.mutedForeground} />
                <Text
                  className={cn(
                    "text-xs font-jakarta-semibold",
                    selected ? "text-brand" : "text-muted-foreground",
                  )}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="h-px bg-border" />

      {/* Features */}
      <View className="gap-2">
        <Text className="text-sm font-jakarta-semibold text-foreground">Features</Text>
        <View className="flex-row flex-wrap gap-2">
          {FEATURE_OPTIONS.map((feat) => {
            const selected = form.features.includes(feat);
            return (
              <Pressable
                key={feat}
                onPress={() => toggleFeature(feat)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                className={cn(
                  "rounded-full border-2 px-3 py-1.5",
                  selected ? "border-brand bg-brand/10" : "border-border",
                )}
              >
                <Text
                  className={cn(
                    "text-xs font-jakarta-semibold",
                    selected ? "text-brand" : "text-muted-foreground",
                  )}
                >
                  {feat}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Custom feature input */}
        <View className="mt-1 flex-row items-center gap-2">
          <Input
            placeholder="Add a custom feature…"
            className="flex-1"
            value={customFeature}
            onChangeText={setCustomFeature}
            onSubmitEditing={addCustomFeature}
            returnKeyType="done"
          />
          <Button
            variant="brand"
            size="icon"
            disabled={!customFeature.trim()}
            onPress={addCustomFeature}
            accessibilityLabel="Add feature"
          >
            <Plus size={18} color={tokens.brandForeground} />
          </Button>
        </View>

        {customFeatures.length > 0 ? (
          <View className="flex-row flex-wrap gap-2">
            {customFeatures.map((feat) => (
              <View
                key={feat}
                className="flex-row items-center gap-1.5 rounded-full border-2 border-brand bg-brand/10 px-3 py-1.5"
              >
                <Text className="text-xs font-jakarta-semibold text-brand">{feat}</Text>
                <Pressable
                  onPress={() => update({ features: form.features.filter((f) => f !== feat) })}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${feat}`}
                >
                  <X size={12} color={tokens.brand} />
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}
