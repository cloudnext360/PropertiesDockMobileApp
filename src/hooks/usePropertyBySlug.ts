import { useQuery } from "@tanstack/react-query";

import { apiGet } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { resolveImageUrl } from "@/lib/utils";
import type { ApiEnvelope, ApiPropertyDetail } from "@/types/api";

export function usePropertyBySlug(slug: string) {
  return useQuery({
    queryKey: queryKeys.propertyBySlug(slug),
    enabled: !!slug,
    queryFn: async () => {
      const res = await apiGet<ApiEnvelope<ApiPropertyDetail>>(`/api/properties/slug/${slug}`);
      const p = res.data;
      return { ...p, images: p.images.map((img) => ({ ...img, url: resolveImageUrl(img.url) })) };
    },
  });
}
