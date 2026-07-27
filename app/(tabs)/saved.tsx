import { SavedList } from "@/features/account/SavedList";
import { View } from "react-native";

export default function SavedScreen() {
  return (
    <View className="flex-1 bg-white dark:bg-background">
      <SavedList />
    </View>
  );
}
