import { View } from "react-native";

import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { PROPERTY_TYPES, type StepProps } from "@/taxonomy/property";
import { Field, SegmentedControl, StepHeader } from "./ui";

const BED_BATH_OPTIONS = ["1", "2", "3", "4", "5", "6", "7", "8"];

export function BasicsStep({ form, update, touched }: StepProps) {
  const majorTypes = Object.keys(PROPERTY_TYPES[form.category]);
  const subtypes = form.majorType ? (PROPERTY_TYPES[form.category][form.majorType] ?? []) : [];
  const isResidential = form.category === "Residential";

  const err = touched
    ? {
        name: !form.name.trim()
          ? "Property name is required"
          : form.name.trim().length < 3
            ? "Property name must be at least 3 characters"
            : "",
        majorType: !form.majorType ? "Please select a property type" : "",
        subtype: !form.subtype ? "Please select a subtype" : "",
      }
    : { name: "", majorType: "", subtype: "" };

  const subtypeLabel = subtypes.find((s) => s.value === form.subtype)?.label;

  return (
    <View className="gap-5">
      <StepHeader
        title="Basic identity"
        subtitle="Tell us the category, type, and listing style of your property."
      />

      <Field label="Property Category">
        <SegmentedControl
          options={["Residential", "Commercial"] as const}
          value={form.category}
          onChange={(cat) => update({ category: cat, majorType: "", subtype: "" })}
        />
      </Field>

      <Field label="Property Major Type" required error={err.majorType}>
        <Select
          value={form.majorType ? { value: form.majorType, label: form.majorType } : undefined}
          onValueChange={(opt) => update({ majorType: opt?.value ?? "", subtype: "" })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {majorTypes.map((t) => (
              <SelectItem key={t} value={t} label={t} />
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Property Subtype" required error={err.subtype}>
        <Select
          value={
            form.subtype && subtypeLabel ? { value: form.subtype, label: subtypeLabel } : undefined
          }
          onValueChange={(opt) => update({ subtype: opt?.value ?? "" })}
        >
          <SelectTrigger disabled={!form.majorType}>
            <SelectValue placeholder={form.majorType ? "Select subtype" : "Select major type first"} />
          </SelectTrigger>
          <SelectContent>
            {subtypes.map((s) => (
              <SelectItem key={s.value} value={s.value} label={s.label} />
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Property Name" required error={err.name}>
        <Input
          placeholder="e.g. Sky Garden Penthouse"
          value={form.name}
          onChangeText={(name) => update({ name })}
        />
      </Field>

      <Field label="Listing Type">
        <SegmentedControl
          options={["Sale", "Rent"] as const}
          value={form.type}
          onChange={(type) => update({ type })}
          labelPrefix="For"
        />
      </Field>

      {isResidential ? (
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Field label="Bedrooms">
              <Select
                value={form.beds ? { value: form.beds, label: form.beds } : undefined}
                onValueChange={(opt) => update({ beds: opt?.value ?? "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {BED_BATH_OPTIONS.map((n) => (
                    <SelectItem key={n} value={n} label={n} />
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </View>
          <View className="flex-1">
            <Field label="Bathrooms">
              <Select
                value={form.baths ? { value: form.baths, label: form.baths } : undefined}
                onValueChange={(opt) => update({ baths: opt?.value ?? "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {BED_BATH_OPTIONS.map((n) => (
                    <SelectItem key={n} value={n} label={n} />
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </View>
        </View>
      ) : null}
    </View>
  );
}
