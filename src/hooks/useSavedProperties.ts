import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import { useAuth } from "@/context/AuthContext";
import { MUTATION_KEYS } from "@/features/offline/offline-mutations";
import { apiDelete, apiGet, apiPost } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { ApiEnvelope } from "@/types/api";
import type { SavedProperty } from "@/types/dashboard";

// Backed by /api/saved-properties (modules/saved-properties; entries stored on
// User.settings JSON). The query still degrades to [] on error and toggles
// surface a toast, so the UI stays usable if the endpoint is unreachable.
export type { SavedProperty };

function savedPropertyId(s: SavedProperty): string | undefined {
  return s.property?.id ?? s.propertyId;
}

export function useSavedProperties() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: queryKeys.savedProperties(),
    enabled: !!user,
    retry: false,
    queryFn: async () => {
      const res = await apiGet<ApiEnvelope<SavedProperty[]>>("/api/saved-properties");
      return res.data ?? [];
    },
  });

  const savedIds = useMemo(
    () => new Set((query.data ?? []).map(savedPropertyId).filter(Boolean) as string[]),
    [query.data],
  );

  return { ...query, savedIds };
}

/** Toggle save/unsave. Returns the mutation + a convenience toggle(propertyId, isSaved). */
export function useToggleSaveProperty() {
  const qc = useQueryClient();

  // mutationKey matches the offline defaults → save/unsave made offline are queued
  // and replayed on reconnect.
  const save = useMutation({
    mutationKey: MUTATION_KEYS.saveProperty,
    mutationFn: (propertyId: string) =>
      apiPost<ApiEnvelope<SavedProperty>>(`/api/saved-properties/${propertyId}`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.savedProperties() }),
  });

  const remove = useMutation({
    mutationKey: MUTATION_KEYS.unsaveProperty,
    mutationFn: (savedId: string) => apiDelete(`/api/saved-properties/${savedId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.savedProperties() }),
  });

  return { save, remove };
}
