// API response shapes ported 1:1 from PropertyDockFrontend/src/types/profile.ts.
// Plain interfaces — no DOM/web deps — so they are reusable verbatim.
// Candidate for a shared @propertydock/core package (MOBILE_PLAN.md §5).

export interface AgencyMembership {
  id: string;
  userId: string;
  agencyId: string;
  role: "ADMIN" | "SUB_ADMIN" | "BROKER";
  status: "ACTIVE" | "SUSPENDED";
  joinedAt: string;
  suspendedAt: string | null;
  updatedAt: string;
  agency: { id: string; name: string; slug: string };
}

export interface FullUser {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  generalUser: {
    id: string;
    userId: string;
    bio: string | null;
    creditWallet: { id: string; balance: number } | null;
    createdAt: string;
    updatedAt: string;
  } | null;
  agencyMemberships: AgencyMembership[];
}

/**
 * Agency public profile — GET /api/agencies/public/:slug.
 *
 * Shaped by the backend's buildPublicProfile(): note `bannerUrl` is the mapped
 * name for the DB's `coverUrl`, and rating/reviewCount/reviews are hardcoded
 * placeholders (0/0/[]) until reviews exist. The listings themselves are NOT
 * included — fetch them separately with useProperties({ agencyId }).
 */
export interface AgencyPublicProfile {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  rating: number;
  reviewCount: number;
  totalListings: number;
  soldListings: number;
  happyClients: number;
  reviews: unknown[];
}

export interface PublicUserAgencyMembership {
  id: string;
  role: "ADMIN" | "SUB_ADMIN" | "BROKER";
  joinedAt: string;
  agency: { id: string; name: string; slug: string; logoUrl: string | null };
}

export interface PublicUser {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  isVerified: boolean;
  createdAt: string;
  email?: string;
  phone?: string;
  generalUser: { bio: string | null } | null;
  agencyMemberships: PublicUserAgencyMembership[];
  properties: ApiProperty[];
}

export interface ApiPropertyOwner {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
}

export interface ApiPropertyAgencyMember extends ApiPropertyOwner {
  agency: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
  };
}

export interface ApiPropertyImage {
  id: string;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ApiProperty {
  id: string;
  propertyName: string;
  slug: string;
  description: string | null;
  category: "RESIDENTIAL" | "COMMERCIAL";
  majorType: string;
  subType: string;
  listingType: "SALE" | "RENT";
  status: string;
  price: number;
  currency: string;
  address: string;
  city: string;
  state: string;
  country: string;
  governorate?: string;
  latitude?: number | null;
  longitude?: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  // Backend returns `areaSqm` (the web type's `areaSqft` is drift — MOBILE_PLAN §4).
  areaSqm?: number | null;
  areaSqft?: number | null;
  isFeatured: boolean;
  images: ApiPropertyImage[];
  createdAt: string;
  agency?: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
  } | null;
}

export interface ApiPropertyDetail extends ApiProperty {
  block: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  yearBuilt: number | null;
  features: string[];
  amenities: string[];
  viewCount: number;
  negotiable: boolean;
  generalUser: ApiPropertyOwner | null;
  agencyMember: ApiPropertyAgencyMember | null;
  _count: { inquiries: number };
}

// ── Response envelope helpers (backend utils/response.ts) ───────────────────────
export interface ApiEnvelope<T> {
  success: true;
  message?: string;
  data: T;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** GET /api/properties → top-level pagination (sendPaginated). */
export interface PaginatedEnvelope<T> {
  success: true;
  data: T[];
  pagination: Pagination;
}

/** e.g. GET /api/properties/my, /api/inquiries/me → paginated object nested in `data`. */
export interface NestedPaginatedEnvelope<T> {
  success: true;
  data: { items: T[] } & Pagination;
}
