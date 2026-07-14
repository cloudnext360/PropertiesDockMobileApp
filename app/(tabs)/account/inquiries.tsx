import { FlashList } from "@shopify/flash-list";
import { View } from "react-native";

import { Button, Skeleton, Text } from "@/components/ui";
import { AccountShell } from "@/features/account/AccountShell";
import { InquiryRow } from "@/features/account/InquiryRow";
import { useInquiries } from "@/hooks/useInquiries";

export default function InquiriesScreen() {
  const { data, isLoading, isError, refetch } = useInquiries();

  return (
    <AccountShell active="inquiries">
      {isLoading ? (
        <View className="gap-3 bg-background p-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center gap-3 bg-background px-8">
          <Text className="text-center font-jakarta-semibold text-foreground">Couldn&apos;t load inquiries</Text>
          <Button variant="brand" size="sm" onPress={() => refetch()}>
            Retry
          </Button>
        </View>
      ) : (
        <View className="flex-1 bg-background">
          <FlashList
            data={data ?? []}
            keyExtractor={(i) => i.id}
            contentContainerStyle={{ padding: 16 }}
            ItemSeparatorComponent={() => <View className="h-3" />}
            renderItem={({ item }) => <InquiryRow inquiry={item} />}
            ListEmptyComponent={
              <View className="items-center justify-center gap-2 px-8 py-24">
                <Text className="text-center font-jakarta-semibold text-foreground">No inquiries yet</Text>
                <Text className="text-center text-sm text-muted-foreground">
                  Inquiries you send or receive will appear here.
                </Text>
              </View>
            }
          />
        </View>
      )}
    </AccountShell>
  );
}
