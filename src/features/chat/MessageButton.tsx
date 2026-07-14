import { useRouter, type Href } from "expo-router";
import { toast } from "sonner-native";

import { Button } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";

import { useStartConversation } from "./hooks";

type MessageButtonProps = {
  /** The user to open a conversation with. */
  recipientId: string;
  /** Optional listing the conversation is about. */
  propertyId?: string;
  label?: string;
  variant?: "brand" | "outline" | "secondary";
  size?: "default" | "sm" | "lg";
  className?: string;
};

/**
 * Opens (or creates) a conversation with `recipientId` and navigates into the
 * thread. Handles the signed-out case, shows a loading spinner while the
 * conversation is being created, and toasts on failure. Callers decide when to
 * render it (e.g. hide it on your own listing).
 */
export function MessageButton({
  recipientId,
  propertyId,
  label = "Message",
  variant = "outline",
  size = "default",
  className,
}: MessageButtonProps) {
  const router = useRouter();
  const { user } = useAuth();
  const startChat = useStartConversation();

  const onPress = () => {
    if (!user) {
      toast("Sign in to send messages");
      router.push("/auth");
      return;
    }
    startChat.mutate(
      { recipientId, ...(propertyId ? { propertyId } : {}) },
      {
        onSuccess: (conversation) =>
          router.push({
            pathname: "/chat/[id]",
            params: { id: conversation.id },
          } as unknown as Href),
        onError: () => toast.error("Couldn't start the conversation"),
      },
    );
  };

  return (
    <Button
      variant={variant}
      size={size}
      loading={startChat.isPending}
      onPress={onPress}
      className={className}
    >
      {label}
    </Button>
  );
}
