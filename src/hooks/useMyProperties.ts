import { useQuery } from "@tanstack/react-query";

import { apiGet } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { resolveImageUrl } from "@/lib/utils";
import type { ApiProperty } from "@/types/api";

// Mirror of web useMyProperties. GET /api/properties/my returns a nested paginated
// object (data.items). agencyMemberId is a scalar column on every property.
type BackendProperty = ApiProperty & { agencyMemberId: string | null };
interface BackendResponse {
  success: true;
  data: { items: BackendProperty[]; total: number; page: number; limit: number; totalPages: number };
}

export interface MyPropertiesResult {
  personal: ApiProperty[];
  agency: ApiProperty[];
}

export function useMyProperties() {
  return useQuery<MyPropertiesResult>({
    queryKey: queryKeys.myProperties(),
    queryFn: async () => {
      const res = await apiGet<BackendResponse>("/api/properties/my");
      const items = (res.data?.items ?? []).map((p) => ({
        ...p,
        images: p.images.map((img) => ({ ...img, url: resolveImageUrl(img.url) })),
      }));
      return {
        personal: items.filter((p) => !p.agencyMemberId) as ApiProperty[],
        agency: items.filter((p) => !!p.agencyMemberId) as ApiProperty[],
      };
    },
  });
}
