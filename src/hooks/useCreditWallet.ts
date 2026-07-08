import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/context/AuthContext";
import { apiGet } from "@/lib/api";
import type { ApiEnvelope } from "@/types/api";

export interface CreditWallet {
  id?: string;
  balance: number;
}

// GET /api/credits/wallet/me — the signed-in user's credit balance.
export function useCreditWallet() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["credit-wallet", "me"],
    enabled: !!user,
    retry: false,
    queryFn: async () => {
      const res = await apiGet<ApiEnvelope<CreditWallet>>("/api/credits/wallet/me");
      return res.data;
    },
  });
}
