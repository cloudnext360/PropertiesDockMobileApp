// ─── Oman localization constants ──────────────────────────────────────────────
// Ported 1:1 from PropertyDockFrontend/src/constants/locale.ts.
// Single source of truth for country/region defaults. Reference these instead of
// hardcoding "USD"/"en-US"/"+1" anywhere in the app.
//
// NOTE (see MOBILE_PLAN.md §4): the web list uses "Al Dakhiliyah" while the backend
// config/oman.ts uses "Al Dakhliyah". This file mirrors the WEB spelling; reconcile
// in a shared package before relying on server-side matching.

export const COUNTRY = "Oman";
export const CURRENCY = "OMR";
export const LOCALE = "en-OM";
export const DIAL_CODE = "+968";

// Phone placeholder used across auth/profile/inquiry forms.
export const PHONE_PLACEHOLDER = "+968 9123 4567";

// Governorates of Oman — use for country/region dropdowns.
export const GOVERNORATES = [
  "Muscat",
  "Dhofar",
  "Musandam",
  "Al Buraimi",
  "Al Dakhiliyah",
  "Al Dhahirah",
  "Al Batinah North",
  "Al Batinah South",
  "Al Sharqiyah North",
  "Al Sharqiyah South",
  "Al Wusta",
] as const;

export type Governorate = (typeof GOVERNORATES)[number];

// Format a price in Omani Rial. Defaults to OMR + en-OM locale.
// Relies on Intl (available in Hermes on Expo SDK 57).
export function formatOmr(
  price: number,
  currency: string = CURRENCY,
  listingType?: "SALE" | "RENT",
): string {
  const fmt = new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: currency || CURRENCY,
    maximumFractionDigits: 0,
  });
  return listingType === "RENT" ? `${fmt.format(price)}/mo` : fmt.format(price);
}
