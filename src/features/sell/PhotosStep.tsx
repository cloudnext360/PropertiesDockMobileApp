import * as ImagePicker from "expo-image-picker";
import { ImagePlus, X } from "lucide-react-native";
import { Pressable, View } from "react-native";

import { AppImage } from "@/components/ui/image";
import { Text } from "@/components/ui";
import type { PickedImage, StepProps } from "@/taxonomy/property";
import { useThemeTokens } from "@/theme/theme-provider";
import { StepHeader } from "./ui";

// Mirrors the backend multer config: field "images", max 15 files,
// JPEG/PNG/WebP, 5 MB per file.
const MAX_IMAGES = 15;

export function PhotosStep({ form, update, touched }: StepProps) {
  const tokens = useThemeTokens();
  const remaining = MAX_IMAGES - form.imageFiles.length;
  const showError = !!touched && form.imageFiles.length === 0;

  async function pickImages() {
    if (remaining <= 0) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });
    if (result.canceled) return;

    const picked: PickedImage[] = result.assets.map((a, i) => ({
      uri: a.uri,
      name: a.fileName ?? `photo-${form.imageFiles.length + i + 1}.jpg`,
      type: a.mimeType ?? "image/jpeg",
    }));
    update({
      imageFiles: [...form.imageFiles, ...picked],
      imagePreviews: [...form.imagePreviews, ...picked.map((p) => p.uri)],
    });
  }

  function removeImage(index: number) {
    update({
      imageFiles: form.imageFiles.filter((_, i) => i !== index),
      imagePreviews: form.imagePreviews.filter((_, i) => i !== index),
    });
  }

  return (
    <View className="gap-5">
      <StepHeader
        title="Show it off"
        subtitle="Add up to 15 photos (JPEG, PNG or WebP). The first photo becomes the cover."
      />

      <Pressable
        onPress={pickImages}
        disabled={remaining <= 0}
        accessibilityRole="button"
        accessibilityLabel="Add photos"
        className={
          "items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-10 " +
          (showError ? "border-destructive" : "border-border") +
          (remaining <= 0 ? " opacity-50" : "")
        }
      >
        <ImagePlus size={32} color={tokens.brand} />
        <Text className="font-jakarta-semibold text-foreground">
          {form.imageFiles.length === 0 ? "Add photos" : "Add more photos"}
        </Text>
        <Text className="text-xs text-muted-foreground">
          {remaining > 0 ? `${remaining} of ${MAX_IMAGES} remaining` : "Photo limit reached"}
        </Text>
      </Pressable>

      {showError ? (
        <Text className="text-xs text-destructive">Add at least one photo to continue.</Text>
      ) : null}

      {form.imageFiles.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {form.imageFiles.map((img, index) => (
            <View key={`${img.uri}-${index}`} className="relative">
              <AppImage
                source={{ uri: img.uri }}
                contentFit="cover"
                style={{ width: 104, height: 104, borderRadius: 12 }}
              />
              {index === 0 ? (
                <View className="absolute bottom-1 left-1 rounded-md bg-brand px-1.5 py-0.5">
                  <Text className="text-[10px] font-jakarta-bold text-brand-foreground">Cover</Text>
                </View>
              ) : null}
              <Pressable
                onPress={() => removeImage(index)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Remove photo"
                className="absolute right-1 top-1 h-6 w-6 items-center justify-center rounded-full bg-black/60"
              >
                <X size={14} color="#fff" />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
