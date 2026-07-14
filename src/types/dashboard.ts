// Ported from web src/types/dashboard.ts (subset the mobile app uses).

export interface Inquiry {
  id: string;
  direction: "received" | "sent";
  propertyId: string;
  propertyName: string;
  propertySlug: string;
  propertyImage: string | null;
  counterpartName: string;
  counterpartAvatar: string | null;
  /** The other party's user id, when known — enables opening a chat. Null for
   *  anonymous inquirers (received) or when the owner's id isn't available (sent). */
  counterpartUserId: string | null;
  message: string;
  reply: string | null;
  status: "pending" | "replied" | "closed";
  createdAt: string;
  unread: boolean;
}

export interface SavedProperty {
  id: string; // saved-record id
  savedAt?: string;
  propertyId?: string;
  property?: {
    id: string;
    propertyName: string;
    slug: string;
    price: number;
    currency: string;
    listingType: "SALE" | "RENT";
    address?: string;
    city?: string;
    country?: string;
    bedrooms: number | null;
    bathrooms: number | null;
    areaSqm?: number | null;
    areaSqft?: number | null;
    status: string;
    images: { id: string; url: string; isPrimary: boolean; sortOrder?: number }[];
  };
}

export type DocStatus = "not_submitted" | "pending" | "approved" | "rejected";

export interface VerificationDoc {
  type: "national_id" | "passport" | "utility_bill" | "proof_of_license";
  label: string;
  description: string;
  status: DocStatus;
  uploadedAt: string | null;
  rejectionReason: string | null;
}
