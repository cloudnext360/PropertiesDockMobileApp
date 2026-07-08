import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiPut } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { MeUser } from "@/context/AuthContext";
import type { ApiEnvelope } from "@/types/api";

// PUT /api/users/me (UpdateProfileDto accepts firstName, lastName, phone, avatarUrl, bio).
export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateProfilePayload) => {
      const res = await apiPut<ApiEnvelope<MeUser>>("/api/users/me", payload);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.profileMe() }),
  });
}
