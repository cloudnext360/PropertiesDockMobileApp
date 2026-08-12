/**
 * Listing availability, derived from the backend's PropertyStatus.
 *
 * Deleting a property is a SOFT delete — propertydockbackendnew
 * properties.service.ts `deleteProperty` sets status to ARCHIVED rather than
 * removing the row. Public lists and the detail endpoint already filter to
 * APPROVED, so an archived listing simply stops appearing. But anything that
 * holds a *reference* to a specific property (a saved entry, a chat thread)
 * still resolves it, so those screens have to say why it can't be opened.
 *
 * Note there is no EXPIRED status in the enum; SOLD is the closest real state.
 */

/** Mirrors the Prisma PropertyStatus enum. */
export type PropertyStatusValue =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "SOLD"
  | "ARCHIVED"
  | "DELETED";

export interface PropertyAvailability {
  /** True when the listing is live — safe to navigate to its detail screen. */
  available: boolean;
  /** Short badge text to show when it isn't; null when available. */
  label: string | null;
}

const AVAILABLE: PropertyAvailability = { available: true, label: null };

/**
 * Map a status to what the UI should do. Unknown or missing statuses are treated
 * as available on purpose: a client that hasn't been taught a newly added status
 * should keep working rather than hiding a live listing.
 */
export function propertyAvailability(status?: string | null): PropertyAvailability {
  switch (status) {
    case "APPROVED":
      return AVAILABLE;
    case "SOLD":
      return { available: false, label: "Sold" };
    case "ARCHIVED":
    case "DELETED":
    case "REJECTED":
      return { available: false, label: "No longer available" };
    case "DRAFT":
    case "PENDING_APPROVAL":
      return { available: false, label: "Not published" };
    default:
      return AVAILABLE;
  }
}
