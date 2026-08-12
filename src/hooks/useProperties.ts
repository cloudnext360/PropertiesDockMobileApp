import { useQuery } from "@tanstack/react-query";

import { apiGet } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { resolveImageUrl } from "@/lib/utils";
import type { ApiProperty, PaginatedEnvelope } from "@/types/api";

// Mirror of web useProperties (PropertyDockFrontend/src/hooks/useProperties.ts).
export interface PropertyFilters {
  /** Restrict to one agency's listings (backend PropertyFiltersDto.agencyId). */
  agencyId?: string;
  listingType?: "SALE" | "RENT";
  isFeatured?: boolean;
  category?: "RESIDENTIAL" | "COMMERCIAL";
  majorType?: string;
  subType?: string;
  city?: string;
  state?: string;
  country?: string;
  governorate?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  page?: number;
  limit?: number;
  sortBy?: "price_asc" | "price_desc" | "newest" | "oldest" | "most_viewed";
}

/**
 * `options.enabled` lets a caller hold the request until a dependent value is
 * ready (e.g. the agency page waits for the agency id) — without it, the hook
 * would fire an unfiltered "all properties" fetch on the first render.
 */
export function useProperties(
  filters: PropertyFilters = {},
  options: { enabled?: boolean } = {},
) {
  const qs = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null) qs.set(k, String(v));
  });
  const queryString = qs.toString();

  return useQuery({
    queryKey: queryKeys.properties(filters),
    enabled: options.enabled ?? true,
    queryFn: async () => {
      const res = await apiGet<PaginatedEnvelope<ApiProperty>>(
        `/api/properties${queryString ? `?${queryString}` : ""}`,
      );
      const properties = (res.data ?? []).map((p) => ({
        ...p,
        images: p.images.map((img) => ({ ...img, url: resolveImageUrl(img.url) })),
      }));
      return { properties, pagination: res.pagination };
    },
  });
}
