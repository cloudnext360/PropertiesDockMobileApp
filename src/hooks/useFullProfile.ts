import { useQuery } from "@tanstack/react-query";

import { apiGet } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { MeUser } from "@/context/AuthContext";
import type { ApiEnvelope } from "@/types/api";

// Mirror of web useFullProfile — GET /api/users/me. Backend returns the flat base
// User (see MOBILE_PLAN.md §3): no nested generalUser; agencyMemberships optional.
export function useFullProfile() {
  return useQuery({
    queryKey: queryKeys.profileMe(),
    queryFn: async () => {
      const res = await apiGet<ApiEnvelope<MeUser>>("/api/users/me");
      return res.data;
    },
  });
}
