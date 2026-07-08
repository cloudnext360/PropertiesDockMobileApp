import { useLocalSearchParams } from "expo-router";

import { Placeholder } from "@/components/placeholder";

// Deep-link target: /users/:id (mirrors web). Full public profile = Phase 3.
export default function PublicUserScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Placeholder title="User profile" subtitle={id} endpoint="GET /api/users/:id" />;
}
