import { memo } from "react";
import { View } from "react-native";

import { AppImage, Badge, Text } from "@/components/ui";
import { MessageButton } from "@/features/chat/MessageButton";
import type { Inquiry } from "@/types/dashboard";

const STATUS: Record<Inquiry["status"], { label: string; variant: "secondary" | "brand" | "outline" }> = {
  pending: { label: "Pending", variant: "secondary" },
  replied: { label: "Replied", variant: "brand" },
  closed: { label: "Closed", variant: "outline" },
};

export const InquiryRow = memo(function InquiryRow({ inquiry }: { inquiry: Inquiry }) {
  const s = STATUS[inquiry.status];
  return (
    <View className="flex-row gap-3 rounded-xl border border-border bg-card p-3">
      <View className="h-16 w-16 overflow-hidden rounded-lg bg-muted">
        <AppImage
          source={inquiry.propertyImage ? { uri: inquiry.propertyImage } : undefined}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          recyclingKey={inquiry.id}
        />
      </View>
      <View className="flex-1 gap-1">
        <View className="flex-row items-center justify-between">
          <Text className="flex-1 font-jakarta-semibold text-foreground" numberOfLines={1}>
            {inquiry.propertyName}
          </Text>
          {inquiry.unread ? <View className="ml-2 h-2 w-2 rounded-full bg-brand" /> : null}
        </View>
        <Text className="text-xs text-muted-foreground">
          {inquiry.direction === "received" ? `From ${inquiry.counterpartName}` : "You sent"}
        </Text>
        <Text className="text-sm text-foreground" numberOfLines={2}>
          {inquiry.message}
        </Text>
        <View className="mt-0.5 flex-row items-center gap-2">
          <Badge variant={s.variant}>{s.label}</Badge>
          <Badge variant="outline">{inquiry.direction === "received" ? "Received" : "Sent"}</Badge>
        </View>

        {/* A received inquiry from a signed-in user can be answered in chat. */}
        {inquiry.direction === "received" && inquiry.counterpartUserId ? (
          <View className="mt-2 flex-row">
            <MessageButton
              recipientId={inquiry.counterpartUserId}
              propertyId={inquiry.propertyId}
              label="Reply in chat"
              variant="outline"
              size="sm"
            />
          </View>
        ) : null}
      </View>
    </View>
  );
});
