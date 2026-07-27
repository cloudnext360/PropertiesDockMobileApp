import { useMutation } from "@tanstack/react-query";

import { apiPost } from "@/lib/api";

interface ChangePasswordVars {
  currentPassword: string;
  newPassword: string;
}

/**
 * POST /api/auth/change-password. NOTE: the backend invalidates every session
 * (deletes all refresh tokens) on success, so other devices are signed out; the
 * current device keeps working until its access token expires.
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: (vars: ChangePasswordVars) => apiPost("/api/auth/change-password", vars),
  });
}
