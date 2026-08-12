import { useQuery } from "@tanstack/react-query";

import { apiGet } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { AgencyPublicProfile, ApiEnvelope } from "@/types/api";

/**
 * Public agency profile — GET /api/agencies/public/:slug (no auth required).
 * 404s when the slug doesn't exist, which the screen surfaces as an error state.
 */
export function useAgencyBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.agencyBySlug(slug ?? ""),
    enabled: !!slug,
    queryFn: async () => {
      const res = await apiGet<ApiEnvelope<AgencyPublicProfile>>(
        `/api/agencies/public/${encodeURIComponent(slug as string)}`,
      );
      return res.data;
    },
  });
}
