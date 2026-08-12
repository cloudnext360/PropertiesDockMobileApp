import * as ImagePicker from "expo-image-picker";
import { Camera, ImagePlus, X } from "lucide-react-native";
import { useState } from "react";
import { Linking, Pressable, View } from "react-native";
import { toast } from "sonner-native";

import { AppImage } from "@/components/ui/image";
import { Button, Text } from "@/components/ui";
import type { PickedImage, StepProps } from "@/taxonomy/property";
import { useThemeTokens } from "@/theme/theme-provider";
import { StepHeader } from "./ui";

// Mirrors the backend multer config: field "images", max 15 files,
// JPEG/PNG/WebP, 5 MB per file.
const MAX_IMAGES = 15;

export function PhotosStep({ form, update, touched }: StepProps) {
  const tokens = useThemeTokens();
  const [capturing, setCapturing] = useState(false);
  const remaining = MAX_IMAGES - form.imageFiles.length;
  const showError = !!touched && form.imageFiles.length === 0;

  /**
   * Append picked/captured assets. Camera captures usually have no fileName and
   * sometimes no mimeType, so both fall back — the backend keys off the sent
   * filename and content type.
   */
  function addAssets(assets: ImagePicker.ImagePickerAsset[]) {
    const picked: PickedImage[] = assets.map((a, i) => ({
      uri: a.uri,
      name: a.fileName ?? `photo-${form.imageFiles.length + i + 1}.jpg`,
      type: a.mimeType ?? "image/jpeg",
    }));
    update({
      imageFiles: [...form.imageFiles, ...picked],
      imagePreviews: [...form.imagePreviews, ...picked.map((p) => p.uri)],
    });
  }

  async function pickImages() {
    if (remaining <= 0) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });
    if (result.canceled) return;
    addAssets(result.assets);
  }

  /**
   * Shoot a photo with the device camera. Unlike the library picker, the camera
   * takes one shot per launch (launchCameraAsync has no allowsMultipleSelection),
   * so the user taps again for each additional photo.
   */
  async function capturePhoto() {
    if (remaining <= 0 || capturing) return;
    setCapturing(true);
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        // Denied permanently ⇒ the OS won't prompt again; Settings is the only way back.
        if (perm.canAskAgain) {
          toast.error("Camera access is needed to take a photo");
        } else {
          toast.error("Camera access is blocked", {
            description: "Enable it in Settings to photograph your property.",
            action: { label: "Settings", onClick: () => Linking.openSettings() },
          });
        }
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.8,
      });
      if (result.canceled) return;
      addAssets(result.assets);
    } catch {
      toast.error("Couldn't open the camera");
    } finally {
      setCapturing(false);
    }
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

      <Button
        variant="outline"
        onPress={capturePhoto}
        disabled={remaining <= 0}
        loading={capturing}
        accessibilityLabel="Take a photo with the camera"
      >
        <Camera size={18} color={tokens.foreground} />
        <Text className="text-sm font-jakarta-semibold text-foreground">Take a photo</Text>
      </Button>

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
