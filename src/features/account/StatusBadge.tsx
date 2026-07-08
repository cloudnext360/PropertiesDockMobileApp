import { Badge } from "@/components/ui";

type Variant = "default" | "secondary" | "destructive" | "outline" | "brand";

const MAP: Record<string, { label: string; variant: Variant }> = {
  DRAFT: { label: "Draft", variant: "outline" },
  PENDING_APPROVAL: { label: "Pending", variant: "secondary" },
  APPROVED: { label: "Approved", variant: "brand" },
  REJECTED: { label: "Rejected", variant: "destructive" },
  SOLD: { label: "Sold", variant: "secondary" },
  ARCHIVED: { label: "Archived", variant: "outline" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = MAP[status] ?? { label: status, variant: "outline" as Variant };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
