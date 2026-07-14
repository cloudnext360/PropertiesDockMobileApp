import { useLocalSearchParams } from "expo-router";

import { Placeholder } from "@/components/placeholder";
import { useAuth } from "@/context/AuthContext";
import { MessageButton } from "@/features/chat/MessageButton";

// Deep-link target: /users/:id (mirrors web). Full public profile = Phase 3.
// The route param IS the user id, so we can already offer to message them.
export default function PublicUserScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const canMessage = !!id && id !== user?.userId;

  return (
    <Placeholder title="User profile" subtitle={id} endpoint="GET /api/users/:id">
      {canMessage ? <MessageButton recipientId={id} variant="brand" /> : null}
    </Placeholder>
  );
}
