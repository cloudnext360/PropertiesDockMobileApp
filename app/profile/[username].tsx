import { useLocalSearchParams } from "expo-router";

import { Placeholder } from "@/components/placeholder";

// Deep-link target: /profile/:username (mirrors web). Full public profile = Phase 3.
export default function ProfileByUsernameScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  return (
    <Placeholder
      title="Profile"
      subtitle={`@${username}`}
      endpoint="GET /api/users/username/:username"
    />
  );
}
