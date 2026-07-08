import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiDelete } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

// DELETE /api/properties/:id — owner or agency admin only.
export function useDeleteProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/properties/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.myProperties() }),
  });
}
