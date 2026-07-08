import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiPut } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { ApiEnvelope } from "@/types/api";

// PUT /api/users/me { bio } — a focused bio-only update (mirrors web useUpdateBio).
export function useUpdateBio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bio: string | null) => {
      const res = await apiPut<ApiEnvelope<unknown>>("/api/users/me", { bio });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.profileMe() }),
  });
}
