import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { resolveImageUrl } from "@/lib/utils";
import type { Inquiry } from "@/types/dashboard";

// Mirror of web useInquiries. GET /api/inquiries/me?direction=received|sent.
type BackendInquiry = {
  id: string;
  propertyId: string;
  property: {
    propertyName: string;
    slug: string;
    images: { id: string; url: string; isPrimary: boolean }[];
  };
  userId: string | null;
  name: string;
  email: string;
  message: string;
  status: "OPEN" | "RESPONDED" | "CLOSED";
  response: string | null;
  createdAt: string;
};

type PaginatedData<T> = {
  success: true;
  data: { items: T[]; total: number; page: number; limit: number; totalPages: number };
};

function mapStatus(s: BackendInquiry["status"]): Inquiry["status"] {
  if (s === "OPEN") return "pending";
  if (s === "RESPONDED") return "replied";
  return "closed";
}

function primaryImage(images: BackendInquiry["property"]["images"]): string | null {
  const url = images.find((i) => i.isPrimary)?.url ?? images[0]?.url ?? null;
  return url ? resolveImageUrl(url) : null;
}

function toFrontend(b: BackendInquiry, direction: "received" | "sent"): Inquiry {
  return {
    id: b.id,
    direction,
    propertyId: b.propertyId,
    propertyName: b.property.propertyName,
    propertySlug: b.property.slug,
    propertyImage: primaryImage(b.property.images),
    counterpartName: direction === "received" ? b.name : "Property Owner",
    counterpartAvatar: null,
    // For received inquiries the counterpart is the (optional) signed-in inquirer.
    // For sent inquiries the owner's user id isn't in this payload.
    counterpartUserId: direction === "received" ? b.userId : null,
    message: b.message,
    reply: b.response,
    status: mapStatus(b.status),
    createdAt: b.createdAt,
    unread: direction === "received" ? b.status === "OPEN" : b.status === "RESPONDED",
  };
}

export function useInquiries() {
  return useQuery<Inquiry[]>({
    queryKey: queryKeys.inquiries(),
    queryFn: async () => {
      const [received, sent] = await Promise.all([
        apiGet<PaginatedData<BackendInquiry>>("/api/inquiries/me?direction=received"),
        apiGet<PaginatedData<BackendInquiry>>("/api/inquiries/me?direction=sent"),
      ]);
      return [
        ...(received.data?.items ?? []).map((i) => toFrontend(i, "received")),
        ...(sent.data?.items ?? []).map((i) => toFrontend(i, "sent")),
      ];
    },
  });
}

export function useRespondToInquiry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, response }: { id: string; response: string }) =>
      apiPost(`/api/inquiries/${id}/respond`, { response }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.inquiries() }),
  });
}

export function useCloseInquiry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPatch(`/api/inquiries/${id}/close`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.inquiries() }),
  });
}
