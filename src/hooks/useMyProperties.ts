import { useQuery } from "@tanstack/react-query";

import { apiGet } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { resolveImageUrl } from "@/lib/utils";
import type { ApiProperty } from "@/types/api";

// A listing as shown on the "My Listings" screen: the base property plus the
// management-only stats the /my endpoint returns (views + lead/inquiry count)
// and approvedAt (publish date). viewCount/approvedAt are scalar columns;
// _count.inquiries is added by getMyProperties' include.
export interface MyProperty extends ApiProperty {
  viewCount: number;
  approvedAt: string | null;
  _count?: { inquiries: number };
}

// Mirror of web useMyProperties. GET /api/properties/my returns a nested paginated
// object (data.items). agencyMemberId is a scalar column on every property.
type BackendProperty = MyProperty & { agencyMemberId: string | null };
interface BackendResponse {
  success: true;
  data: { items: BackendProperty[]; total: number; page: number; limit: number; totalPages: number };
}

export interface MyPropertiesResult {
  personal: MyProperty[];
  agency: MyProperty[];
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
        personal: items.filter((p) => !p.agencyMemberId),
        agency: items.filter((p) => !!p.agencyMemberId),
      };
    },
  });
}
