import { apiDelete, apiPost } from "@/lib/api";
import { queryClient } from "@/lib/query-client";
import type { CreateInquiryInput } from "@/hooks/useCreateInquiry";

// Stable mutation keys. Mutations offline are paused by React Query and replayed on
// reconnect (onlineManager) or after a persisted restart (resumePausedMutations).
// For replay to work, each key needs a default mutationFn registered here — the
// restored mutation only carries its key + variables, not the original function.
export const MUTATION_KEYS = {
  createInquiry: ["inquiry", "create"] as const,
  saveProperty: ["saved", "add"] as const,
  unsaveProperty: ["saved", "remove"] as const,
};

let registered = false;

export function registerOfflineMutations() {
  if (registered) return;
  registered = true;

  queryClient.setMutationDefaults(MUTATION_KEYS.createInquiry, {
    mutationFn: (input: CreateInquiryInput) => {
      const body = { ...input, phone: input.phone?.trim() ? input.phone.trim() : undefined };
      return apiPost("/api/inquiries", body);
    },
  });

  queryClient.setMutationDefaults(MUTATION_KEYS.saveProperty, {
    mutationFn: (propertyId: string) => apiPost(`/api/saved-properties/${propertyId}`, {}),
  });

  queryClient.setMutationDefaults(MUTATION_KEYS.unsaveProperty, {
    mutationFn: (savedId: string) => apiDelete(`/api/saved-properties/${savedId}`),
  });
}
