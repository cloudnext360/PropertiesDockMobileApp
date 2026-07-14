import { FlashList } from "@shopify/flash-list";
import { useState } from "react";
import { View } from "react-native";
import { toast } from "sonner-native";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Skeleton,
  Text,
} from "@/components/ui";
import { AccountShell } from "@/features/account/AccountShell";
import { ListingRow } from "@/features/account/ListingRow";
import { useDeleteProperty } from "@/hooks/useDeleteProperty";
import { useMyProperties } from "@/hooks/useMyProperties";
import type { ApiProperty } from "@/types/api";

export default function ListingsScreen() {
  const { data, isLoading, isError, refetch } = useMyProperties();
  const del = useDeleteProperty();
  const [target, setTarget] = useState<ApiProperty | null>(null);

  const items = data ? [...data.personal, ...data.agency] : [];

  const confirmDelete = () => {
    if (!target) return;
    del.mutate(target.id, {
      onSuccess: () => {
        toast.success("Listing deleted");
        setTarget(null);
      },
      onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
    });
  };

  return (
    <AccountShell active="listings">
      {isLoading ? (
        <View className="gap-3 bg-background p-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center gap-3 bg-background px-8">
          <Text className="text-center font-jakarta-semibold text-foreground">
            Couldn&apos;t load your listings
          </Text>
          <Button variant="brand" size="sm" onPress={() => refetch()}>
            Retry
          </Button>
        </View>
      ) : (
        <View className="flex-1 bg-background">
          <FlashList
            data={items}
            keyExtractor={(p) => p.id}
            contentContainerStyle={{ padding: 16 }}
            ItemSeparatorComponent={() => <View className="h-3" />}
            renderItem={({ item }) => <ListingRow property={item} onDelete={setTarget} />}
            ListEmptyComponent={
              <View className="items-center justify-center gap-2 px-8 py-24">
                <Text className="text-center font-jakarta-semibold text-foreground">No listings yet</Text>
                <Text className="text-center text-sm text-muted-foreground">
                  List a property from the Sell tab.
                </Text>
              </View>
            }
          />

          <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete listing?</DialogTitle>
                <DialogDescription>
                  {target ? `"${target.propertyName}" will be permanently removed.` : ""}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="ghost" onPress={() => setTarget(null)}>
                  Cancel
                </Button>
                <Button variant="destructive" loading={del.isPending} onPress={confirmDelete}>
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </View>
      )}
    </AccountShell>
  );
}
