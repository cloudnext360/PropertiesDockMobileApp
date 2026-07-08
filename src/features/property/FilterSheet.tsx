import { useState } from "react";
import { ScrollView, useWindowDimensions, View } from "react-native";

import { Button, Input, Sheet, SheetContent, SheetHeader, SheetTitle, Text } from "@/components/ui";
import { Chip } from "@/features/property/Chip";
import { GOVERNORATES } from "@/constants/locale";
import { MAJOR_TYPE_TO_API, PROPERTY_TYPES } from "@/taxonomy/property";
import type { PropertyFilters } from "@/hooks/useProperties";

// The filterable subset the sheet controls.
export type PropertyFilterValues = Pick<
  PropertyFilters,
  | "listingType"
  | "category"
  | "majorType"
  | "subType"
  | "governorate"
  | "minPrice"
  | "maxPrice"
  | "bedrooms"
  | "bathrooms"
>;

const API_TO_MAJOR_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(MAJOR_TYPE_TO_API).map(([label, api]) => [api, label]),
);

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      <Text className="text-xs font-jakarta-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </Text>
      <View className="flex-row flex-wrap gap-2">{children}</View>
    </View>
  );
}

interface FilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: PropertyFilterValues;
  onApply: (value: PropertyFilterValues) => void;
}

export function FilterSheet({ open, onOpenChange, value, onApply }: FilterSheetProps) {
  const { height } = useWindowDimensions();
  const [draft, setDraft] = useState<PropertyFilterValues>(value);
  const [minP, setMinP] = useState(value.minPrice != null ? String(value.minPrice) : "");
  const [maxP, setMaxP] = useState(value.maxPrice != null ? String(value.maxPrice) : "");

  // Seed the draft from the applied value each time the sheet opens.
  // Render-phase sync (React's "adjust state on prop change" pattern) — no effect.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setDraft(value);
      setMinP(value.minPrice != null ? String(value.minPrice) : "");
      setMaxP(value.maxPrice != null ? String(value.maxPrice) : "");
    }
  }

  const categoryLabel = draft.category === "COMMERCIAL" ? "Commercial" : "Residential";
  const majorLabels = draft.category ? Object.keys(PROPERTY_TYPES[categoryLabel]) : [];
  const selectedMajorLabel = draft.majorType ? API_TO_MAJOR_LABEL[draft.majorType] : undefined;
  const subTypes = selectedMajorLabel
    ? (PROPERTY_TYPES[categoryLabel][selectedMajorLabel] ?? [])
    : [];

  const patch = (p: Partial<PropertyFilterValues>) => setDraft((d) => ({ ...d, ...p }));

  const apply = () => {
    onApply({
      ...draft,
      minPrice: minP ? Number(minP) : undefined,
      maxPrice: maxP ? Number(maxP) : undefined,
    });
    onOpenChange(false);
  };

  const reset = () => {
    setDraft({});
    setMinP("");
    setMaxP("");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>

        <ScrollView
          style={{ maxHeight: height * 0.62, flexShrink: 1 }}
          className="mt-3"
          contentContainerClassName="gap-5 pb-2"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Group label="Listing">
            <Chip label="Any" selected={!draft.listingType} onPress={() => patch({ listingType: undefined })} />
            <Chip label="For Sale" selected={draft.listingType === "SALE"} onPress={() => patch({ listingType: "SALE" })} />
            <Chip label="For Rent" selected={draft.listingType === "RENT"} onPress={() => patch({ listingType: "RENT" })} />
          </Group>

          <Group label="Category">
            <Chip
              label="Any"
              selected={!draft.category}
              onPress={() => patch({ category: undefined, majorType: undefined, subType: undefined })}
            />
            <Chip
              label="Residential"
              selected={draft.category === "RESIDENTIAL"}
              onPress={() => patch({ category: "RESIDENTIAL", majorType: undefined, subType: undefined })}
            />
            <Chip
              label="Commercial"
              selected={draft.category === "COMMERCIAL"}
              onPress={() => patch({ category: "COMMERCIAL", majorType: undefined, subType: undefined })}
            />
          </Group>

          {majorLabels.length > 0 ? (
            <Group label="Property type">
              {majorLabels.map((label) => (
                <Chip
                  key={label}
                  label={label}
                  selected={draft.majorType === MAJOR_TYPE_TO_API[label]}
                  onPress={() => patch({ majorType: MAJOR_TYPE_TO_API[label], subType: undefined })}
                />
              ))}
            </Group>
          ) : null}

          {subTypes.length > 0 ? (
            <Group label="Sub-type">
              {subTypes.map((s) => (
                <Chip
                  key={s.value}
                  label={s.label}
                  selected={draft.subType === s.value}
                  onPress={() => patch({ subType: draft.subType === s.value ? undefined : s.value })}
                />
              ))}
            </Group>
          ) : null}

          <Group label="Governorate">
            <Chip label="Any" selected={!draft.governorate} onPress={() => patch({ governorate: undefined })} />
            {GOVERNORATES.map((g) => (
              <Chip
                key={g}
                label={g}
                selected={draft.governorate === g}
                onPress={() => patch({ governorate: draft.governorate === g ? undefined : g })}
              />
            ))}
          </Group>

          <Group label="Price (OMR)">
            <View className="w-full flex-row items-center gap-3">
              <Input
                className="flex-1"
                placeholder="Min"
                keyboardType="number-pad"
                value={minP}
                onChangeText={setMinP}
              />
              <Text className="text-muted-foreground">–</Text>
              <Input
                className="flex-1"
                placeholder="Max"
                keyboardType="number-pad"
                value={maxP}
                onChangeText={setMaxP}
              />
            </View>
          </Group>

          <Group label="Beds">
            <Chip label="Any" selected={draft.bedrooms == null} onPress={() => patch({ bedrooms: undefined })} />
            {[1, 2, 3, 4, 5].map((n) => (
              <Chip
                key={n}
                label={n === 5 ? "5+" : String(n)}
                selected={draft.bedrooms === n}
                onPress={() => patch({ bedrooms: draft.bedrooms === n ? undefined : n })}
              />
            ))}
          </Group>

          <Group label="Baths">
            <Chip label="Any" selected={draft.bathrooms == null} onPress={() => patch({ bathrooms: undefined })} />
            {[1, 2, 3, 4].map((n) => (
              <Chip
                key={n}
                label={n === 4 ? "4+" : String(n)}
                selected={draft.bathrooms === n}
                onPress={() => patch({ bathrooms: draft.bathrooms === n ? undefined : n })}
              />
            ))}
          </Group>
        </ScrollView>

        <View className="mt-4 flex-row gap-3">
          <Button variant="outline" className="flex-1" onPress={reset}>
            Reset
          </Button>
          <Button variant="brand" className="flex-1" onPress={apply}>
            Show results
          </Button>
        </View>
      </SheetContent>
    </Sheet>
  );
}
