import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/context/AuthContext";
import { apiGet, apiPut } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { ApiEnvelope } from "@/types/api";

// Mirror of web PropertyDockFrontend/src/hooks/useUserSettings.ts.
// GET /api/users/settings → { success, data: UserSettings }
// PUT /api/users/settings → { success, data: UserSettings }
export interface UserSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  profileVisibility: "public" | "private";
  showPhone: boolean;
  showEmail: boolean;
}

const DEFAULTS: UserSettings = {
  emailNotifications: true,
  smsNotifications: false,
  pushNotifications: true,
  profileVisibility: "public",
  showPhone: false,
  showEmail: false,
};

export function useUserSettings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.userSettings(),
    enabled: !!user,
    queryFn: async () => {
      const res = await apiGet<ApiEnvelope<UserSettings>>("/api/users/settings");
      return { ...DEFAULTS, ...res.data };
    },
  });
}

export function useUpdateUserSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<UserSettings>) => {
      const res = await apiPut<ApiEnvelope<UserSettings>>("/api/users/settings", payload);
      return { ...DEFAULTS, ...res.data };
    },
    // Optimistic so toggles flip instantly; rolled back on error.
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: queryKeys.userSettings() });
      const previous = qc.getQueryData<UserSettings>(queryKeys.userSettings());
      qc.setQueryData<UserSettings>(queryKeys.userSettings(), (prev) => ({
        ...(prev ?? DEFAULTS),
        ...payload,
      }));
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKeys.userSettings(), ctx.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.userSettings() });
    },
  });
}
