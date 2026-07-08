import { useLocalSearchParams } from "expo-router";

import { Placeholder } from "@/components/placeholder";

// Deep-link target: /agency/:slug (mirrors web). Full public agency page = Phase 3.
export default function AgencyPublicScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return (
    <Placeholder
      title="Agency"
      subtitle={`@${slug}`}
      endpoint="GET /api/agencies/public/:slug"
    />
  );
}
