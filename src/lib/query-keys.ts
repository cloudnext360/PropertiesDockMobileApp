import type { PropertyFilters } from "@/hooks/useProperties";

/**
 * Query-key conventions, reused verbatim from the web repo so the two clients
 * share the same cache shapes:
 *   ["properties", filters] · ["properties","my"] · ["property","slug",slug]
 *   ["inquiries"] · ["profile","me"] · ["saved-properties"] · ["verification-docs"]
 *   ["agency-by-slug", slug]
 */
export const queryKeys = {
  properties: (filters: PropertyFilters = {}) => ["properties", filters] as const,
  myProperties: () => ["properties", "my"] as const,
  propertyBySlug: (slug: string) => ["property", "slug", slug] as const,
  inquiries: () => ["inquiries"] as const,
  profileMe: () => ["profile", "me"] as const,
  savedProperties: () => ["saved-properties"] as const,
  verificationDocs: () => ["verification-docs"] as const,
  agencyBySlug: (slug: string) => ["agency-by-slug", slug] as const,
};
