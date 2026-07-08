import { X } from "lucide-react-native";
import { FlatList, Modal, Pressable, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppImage } from "@/components/ui";

interface FullscreenGalleryProps {
  images: string[];
  initialIndex?: number;
  visible: boolean;
  onClose: () => void;
}

/** Fullscreen, swipeable image viewer (contain-fit) over a black backdrop. */
export function FullscreenGallery({
  images,
  initialIndex = 0,
  visible,
  onClose,
}: FullscreenGalleryProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} onRequestClose={onClose} animationType="fade">
      <View className="flex-1 bg-black">
        <FlatList
          data={images}
          horizontal
          pagingEnabled
          initialScrollIndex={Math.min(initialIndex, Math.max(images.length - 1, 0))}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, i) => String(i)}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          renderItem={({ item }) => (
            <View style={{ width, height }} className="items-center justify-center">
              <AppImage source={{ uri: item }} style={{ width, height }} contentFit="contain" recyclingKey={item} />
            </View>
          )}
        />
        <Pressable
          onPress={onClose}
          accessibilityLabel="Close"
          style={{ top: insets.top + 8 }}
          className="absolute right-4 h-11 w-11 items-center justify-center rounded-full bg-white/15 active:bg-white/25"
        >
          <X size={22} color="#ffffff" />
        </Pressable>
      </View>
    </Modal>
  );
}
