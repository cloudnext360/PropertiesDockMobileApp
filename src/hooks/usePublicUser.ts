import { useQuery } from "@tanstack/react-query";

import { apiGet } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { ApiEnvelope, PublicUser } from "@/types/api";

/**
 * Public profile of another user — GET /api/users/:id (no auth required).
 *
 * The backend composes this from getUserPublicProfile() plus the user's active
 * agency memberships and their 12 most recent APPROVED listings, so archived or
 * unapproved properties never appear here.
 *
 * Two fields are conditional and must be treated as optional:
 *   · email / phone — only returned when the user's privacy settings allow it
 *     (or the viewer is the owner).
 *   · generalUser   — the backend reads the User row without including the
 *     generalUser relation, so `bio` is absent in practice. Guard before use.
 */
export function usePublicUser(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.publicUser(userId ?? ""),
    enabled: !!userId,
    queryFn: async () => {
      const res = await apiGet<ApiEnvelope<PublicUser>>(`/api/users/${userId}`);
      return res.data;
    },
  });
}
