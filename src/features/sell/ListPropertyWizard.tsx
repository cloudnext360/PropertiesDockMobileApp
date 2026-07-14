import { useHeaderHeight } from "@react-navigation/elements";
import { useRouter } from "expo-router";
import { Check } from "lucide-react-native";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { toast } from "sonner-native";

import { Button, Text } from "@/components/ui";
import { useCreateProperty } from "@/hooks/useCreateProperty";
import { haptics } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import {
  DEFAULT_FORM,
  STEPS,
  STEP_KEYS,
  stepIsValid,
  type FormState,
  type StepKey,
} from "@/taxonomy/property";
import { useThemeTokens } from "@/theme/theme-provider";
import { BasicsStep } from "./BasicsStep";
import { DetailsStep } from "./DetailsStep";
import { LocationStep } from "./LocationStep";
import { PhotosStep } from "./PhotosStep";
import { ReviewStep } from "./ReviewStep";

function StepIndicator({ current }: { current: StepKey }) {
  const tokens = useThemeTokens();
  const currentIdx = STEP_KEYS.indexOf(current);
  return (
    <View className="flex-row items-center justify-between px-1 pb-4">
      {STEPS.map((s, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <View key={s.key} className="flex-1 items-center gap-1">
            <View
              className={cn(
                "h-7 w-7 items-center justify-center rounded-full border-2",
                done || active ? "border-brand bg-brand" : "border-border bg-card",
              )}
            >
              {done ? (
                <Check size={14} strokeWidth={3} color={tokens.brandForeground} />
              ) : (
                <Text
                  className={cn(
                    "text-xs font-jakarta-bold",
                    active ? "text-brand-foreground" : "text-muted-foreground",
                  )}
                >
                  {s.num}
                </Text>
              )}
            </View>
            <Text
              className={cn(
                "text-[10px] font-jakarta-semibold",
                active ? "text-brand" : "text-muted-foreground",
              )}
            >
              {s.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/**
 * 5-step "List Property" wizard (basics → location → details → photos → review).
 * RN port of web ListPropertyPageComponent; submits via useCreateProperty
 * (POST /api/properties, multipart). General-user listings go live immediately.
 */
export function ListPropertyWizard() {
  const router = useRouter();
  // The Sell tab shows a native header; KeyboardAvoidingView measures its frame
  // relative to it, so without this offset the padding is short by the header
  // height and the bottom fields stay hidden behind the keyboard.
  const headerHeight = useHeaderHeight();
  const { mutate: createProperty, isPending } = useCreateProperty();

  const [step, setStep] = useState<StepKey>("basics");
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [touched, setTouched] = useState(false);

  const update = (patch: Partial<FormState>) => setForm((prev) => ({ ...prev, ...patch }));

  const idx = STEP_KEYS.indexOf(step);
  const isReview = step === "review";
  const isFirst = idx === 0;

  const jumpTo = (target: StepKey) => {
    setTouched(false);
    setStep(target);
  };

  const goNext = () => {
    if (isReview) {
      createProperty(form, {
        onSuccess: (data) => {
          haptics.success();
          toast.success("Listing submitted!", {
            description:
              data.status === "APPROVED"
                ? `"${data.propertyName}" is now live.`
                : `"${data.propertyName}" has been submitted and is pending approval.`,
          });
          setForm(DEFAULT_FORM);
          setStep("basics");
          router.push("/account/listings");
        },
        onError: (err) => {
          haptics.warning();
          toast.error("Submission failed", {
            description: err instanceof Error ? err.message : "Please try again.",
          });
        },
      });
      return;
    }

    if (!stepIsValid(step, form)) {
      haptics.warning();
      setTouched(true);
      return;
    }

    setTouched(false);
    const next = STEP_KEYS[idx + 1];
    if (next) setStep(next);
  };

  const goBack = () => {
    setTouched(false);
    const prev = STEP_KEYS[idx - 1];
    if (prev) setStep(prev);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white dark:bg-background"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={headerHeight}
    >
      <View className="flex-1 px-4 pt-3">
        <StepIndicator current={step} />

        <ScrollView
          className="flex-1"
          contentContainerClassName="pb-6"
          keyboardShouldPersistTaps="handled"
        >
          {step === "basics" && <BasicsStep form={form} update={update} touched={touched} />}
          {step === "location" && <LocationStep form={form} update={update} touched={touched} />}
          {step === "details" && <DetailsStep form={form} update={update} touched={touched} />}
          {step === "photos" && <PhotosStep form={form} update={update} touched={touched} />}
          {isReview && <ReviewStep form={form} setStep={jumpTo} />}
        </ScrollView>

        {/* Step navigation */}
        <View className="flex-row gap-3 border-t border-border py-3">
          {!isFirst ? (
            <Button variant="outline" className="flex-1" disabled={isPending} onPress={goBack}>
              Back
            </Button>
          ) : null}
          <Button variant="brand" className="flex-1" loading={isPending} onPress={goNext}>
            {isReview ? "Submit listing" : "Continue"}
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
