import { View } from "react-native";

import { Input } from "@/components/ui";
import type { StepProps } from "@/taxonomy/property";
import { Field, StepHeader } from "./ui";

export function LocationStep({ form, update, touched }: StepProps) {
  const err = touched
    ? {
        address: !form.address.trim() ? "Address is required" : "",
        city: !form.city.trim() ? "City is required" : "",
        country: !form.country.trim() ? "Country is required" : "",
      }
    : { address: "", city: "", country: "" };

  return (
    <View className="gap-5">
      <StepHeader
        title="Where is your property?"
        subtitle="Precise location details help buyers find your listing quickly."
      />

      <Field label="Location Address (Full)" required error={err.address}>
        <Input
          placeholder="e.g. Way No 1234, Villa 56"
          value={form.address}
          onChangeText={(address) => update({ address })}
        />
      </Field>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <Field label="Block / Sector">
            <Input
              placeholder="e.g. Sector 4"
              value={form.block}
              onChangeText={(block) => update({ block })}
            />
          </Field>
        </View>
        <View className="flex-1">
          <Field label="City" required error={err.city}>
            <Input
              placeholder="e.g. Muscat"
              value={form.city}
              onChangeText={(city) => update({ city })}
            />
          </Field>
        </View>
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <Field label="Postal Code">
            <Input
              placeholder="e.g. 113"
              keyboardType="number-pad"
              value={form.postalCode}
              onChangeText={(postalCode) => update({ postalCode })}
            />
          </Field>
        </View>
        <View className="flex-1">
          <Field label="State / Governorate">
            <Input
              placeholder="e.g. Muscat Governorate"
              value={form.state}
              onChangeText={(state) => update({ state })}
            />
          </Field>
        </View>
      </View>

      <Field label="Country" required error={err.country}>
        <Input
          placeholder="e.g. Oman"
          value={form.country}
          onChangeText={(country) => update({ country })}
        />
      </Field>
    </View>
  );
}
