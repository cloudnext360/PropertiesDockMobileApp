import { useMutation } from "@tanstack/react-query";

import { MUTATION_KEYS } from "@/features/offline/offline-mutations";

export interface CreateInquiryInput {
  propertyId: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
}

// Public endpoint (no auth): POST /api/inquiries.
// The mutationFn is registered as a default (offline-mutations) keyed by mutationKey,
// so a submission made offline is queued and replayed on reconnect.
export function useCreateInquiry() {
  return useMutation<unknown, Error, CreateInquiryInput>({
    mutationKey: MUTATION_KEYS.createInquiry,
  });
}
