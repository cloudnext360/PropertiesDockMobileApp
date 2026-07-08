import { useInfiniteQuery } from "@tanstack/react-query";

import { apiGet } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { resolveImageUrl } from "@/lib/utils";
import type { ApiProperty, PaginatedEnvelope } from "@/types/api";
import type { PropertyFilters } from "@/hooks/useProperties";

const PAGE_SIZE = 12;

/**
 * Paginated infinite list for the Buy/Search screen. Reads `pagination` from the
 * backend envelope (sendPaginated) to compute the next page. Reuses the
 * ["properties", filters] key convention.
 */
export function useInfiniteProperties(filters: PropertyFilters = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.properties(filters),
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const qs = new URLSearchParams();
      Object.entries({ ...filters, page: pageParam, limit: PAGE_SIZE }).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
      });
      const res = await apiGet<PaginatedEnvelope<ApiProperty>>(`/api/properties?${qs.toString()}`);
      const items = (res.data ?? []).map((p) => ({
        ...p,
        images: p.images.map((img) => ({ ...img, url: resolveImageUrl(img.url) })),
      }));
      return { items, pagination: res.pagination };
    },
    getNextPageParam: (last) => {
      const { page, totalPages } = last.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
  });
}
