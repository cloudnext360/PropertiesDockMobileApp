import { Image, type ImageProps } from "expo-image";

// Neutral light-gray blurhash shown while remote images load (avoids layout pop).
export const IMAGE_BLURHASH = "L6Pj0^i_.AyE_3t7t7R**0o#DgR4";

/**
 * App-wide image. Wraps expo-image with a blurhash placeholder, a fade transition,
 * and disk caching so every network image has a consistent loading experience.
 * Pass `recyclingKey` in virtualized lists to prevent stale frames on recycle.
 */
export function AppImage({ transition = 200, ...props }: ImageProps) {
  return (
    <Image
      transition={transition}
      placeholder={{ blurhash: IMAGE_BLURHASH }}
      placeholderContentFit="cover"
      cachePolicy="disk"
      {...props}
    />
  );
}
