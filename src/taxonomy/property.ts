// ─── Property taxonomy ─────────────────────────────────────────────────────────
// Ported from PropertyDockFrontend/src/components/ListProperty/types.ts.
// Every `value` maps to an exact enum on the backend (PropertyCategory /
// PropertyMajorType / PropertySubType / PropertyListingType). Keep in sync with
// prisma/schema.prisma — ideally via a shared package (MOBILE_PLAN.md §5).
//
// Mobile adaptation: the web `FormState.imageFiles: File[]` becomes `PickedImage[]`
// (RN has no File; images are picked as { uri, name, type } via expo-image-picker).

import {
  Waves,
  TreePine,
  Wifi,
  ShieldCheck,
  Car,
  Dumbbell,
  ChefHat,
  Sunset,
  Wind,
  Zap,
  Star,
  Leaf,
  type LucideIcon,
} from "lucide-react-native";

export type StepKey = "basics" | "location" | "details" | "photos" | "review";

/** A locally-picked image, RN equivalent of the web `File`. */
export interface PickedImage {
  uri: string;
  name: string;
  type: string;
}

export interface FormState {
  category: "Residential" | "Commercial";
  majorType: string;
  subtype: string;
  name: string;
  type: "Sale" | "Rent";
  beds: string;
  baths: string;
  address: string;
  block: string;
  city: string;
  postalCode: string;
  state: string;
  country: string;
  price: string;
  area: string;
  yearBuilt: string;
  description: string;
  negotiable: boolean;
  amenities: string[];
  features: string[];
  imageFiles: PickedImage[];
  imagePreviews: string[];
  agentName: string;
  agentTitle: string;
}

export interface StepProps {
  form: FormState;
  update: (patch: Partial<FormState>) => void;
  touched?: boolean;
}

export const STEP_KEYS: StepKey[] = ["basics", "location", "details", "photos", "review"];

export const STEPS = [
  { key: "basics" as StepKey, label: "Basics", num: 1 },
  { key: "location" as StepKey, label: "Location", num: 2 },
  { key: "details" as StepKey, label: "Details", num: 3 },
  { key: "photos" as StepKey, label: "Photos", num: 4 },
  { key: "review" as StepKey, label: "Review", num: 5 },
];

export const DEFAULT_FORM: FormState = {
  category: "Residential",
  majorType: "",
  subtype: "",
  name: "",
  type: "Sale",
  beds: "",
  baths: "",
  address: "",
  block: "",
  city: "",
  postalCode: "",
  state: "",
  country: "Oman",
  price: "",
  area: "",
  yearBuilt: "",
  description: "",
  negotiable: false,
  amenities: [],
  features: [],
  imageFiles: [],
  imagePreviews: [],
  agentName: "",
  agentTitle: "",
};

// ── Property type tree (display label + API enum value) ────────────────────────

export interface PropertySubtype {
  label: string;
  value: string;
}

// ── Every `value` field maps to an exact `PropertySubType` enum value in the DB ──
export const PROPERTY_TYPES: Record<
  "Residential" | "Commercial",
  Record<string, PropertySubtype[]>
> = {
  Residential: {
    "Single-Family Home": [
      { label: "Detached House", value: "DETACHED" },
      { label: "Semi-Detached", value: "SEMI_DETACHED" },
    ],
    "Multi-Family Home": [
      { label: "Duplex", value: "DUPLEX" },
      { label: "Triplex", value: "TRIPLEX" },
      { label: "Quadplex", value: "QUADPLEX" },
    ],
    "Apartment / Flat": [
      { label: "Studio Unit", value: "STUDIO_UNIT" },
      { label: "1-Bedroom", value: "ONE_BEDROOM" },
      { label: "2-Bedroom", value: "TWO_BEDROOM" },
      { label: "3-Bedroom", value: "THREE_BEDROOM" },
      { label: "4+ Bedroom", value: "FOUR_PLUS_BEDROOM" },
      { label: "Penthouse", value: "PENTHOUSE" },
    ],
    "Condominium (Condo)": [
      { label: "Standard Condo", value: "STANDARD_CONDO" },
      { label: "Garden Condo", value: "GARDEN_CONDO" },
      { label: "Luxury Condo", value: "LUXURY_CONDO" },
    ],
    Townhouse: [
      { label: "End Unit Townhouse", value: "END_UNIT_TOWNHOUSE" },
      { label: "Middle Unit Townhouse", value: "MIDDLE_UNIT_TOWNHOUSE" },
    ],
    "Villa / Bungalow": [
      { label: "Detached Villa", value: "DETACHED_VILLA" },
      { label: "Bungalow", value: "BUNGALOW" },
    ],
    "Studio Apartment": [{ label: "Studio", value: "STUDIO" }],
  },
  Commercial: {
    "Office Buildings": [
      { label: "Single-Tenant Office", value: "SINGLE_TENANT_OFFICE" },
      { label: "Multi-Tenant Office", value: "MULTI_TENANT_OFFICE" },
      { label: "Co-Working Space", value: "COWORKING_SPACE" },
    ],
    "Industrial Properties": [
      { label: "Warehouse", value: "WAREHOUSE" },
      { label: "Manufacturing Plant", value: "MANUFACTURING_PLANT" },
      { label: "Flex Space", value: "FLEX_SPACE" },
      { label: "Distribution Center", value: "DISTRIBUTION_CENTER" },
    ],
    "Hospitality Properties": [
      { label: "Hotel", value: "HOTEL" },
      { label: "Motel", value: "MOTEL" },
      { label: "Resort", value: "RESORT" },
      { label: "Bed & Breakfast", value: "BED_AND_BREAKFAST" },
    ],
    "Retail Properties": [
      { label: "Strip Mall", value: "STRIP_MALL" },
      { label: "Shopping Center", value: "SHOPPING_CENTER" },
      { label: "Standalone Retail", value: "STANDALONE_RETAIL" },
      { label: "Showroom", value: "SHOWROOM" },
    ],
    "Mixed-Use Properties": [
      { label: "Residential + Commercial Mix", value: "RESIDENTIAL_COMMERCIAL_MIX" },
      { label: "Live / Work Unit", value: "LIVE_WORK_UNIT" },
    ],
    "Land (Commercial Use)": [
      { label: "Vacant Land", value: "VACANT_LAND" },
      { label: "Agricultural Land", value: "AGRICULTURAL_LAND" },
      { label: "Development Site", value: "DEVELOPMENT_SITE" },
    ],
    "Special Purpose Properties": [
      { label: "Place of Worship", value: "PLACE_OF_WORSHIP" },
      { label: "Educational Facility", value: "EDUCATIONAL_FACILITY" },
      { label: "Healthcare Facility", value: "HEALTHCARE_FACILITY" },
      { label: "Parking Facility", value: "PARKING_FACILITY" },
    ],
  },
};

// Maps the display major type key → API enum value
export const MAJOR_TYPE_TO_API: Record<string, string> = {
  "Single-Family Home": "SINGLE_FAMILY_HOME",
  "Multi-Family Home": "MULTI_FAMILY_HOME",
  "Apartment / Flat": "APARTMENT_FLAT",
  "Condominium (Condo)": "CONDOMINIUM",
  Townhouse: "TOWNHOUSE",
  "Villa / Bungalow": "VILLA_BUNGALOW",
  "Studio Apartment": "STUDIO_APARTMENT",
  "Office Buildings": "OFFICE_BUILDINGS",
  "Retail Properties": "RETAIL_PROPERTIES",
  "Industrial Properties": "INDUSTRIAL_PROPERTIES",
  "Hospitality Properties": "HOSPITALITY_PROPERTIES",
  "Mixed-Use Properties": "MIXED_USE_PROPERTIES",
  "Land (Commercial Use)": "LAND_COMMERCIAL_USE",
  "Special Purpose Properties": "SPECIAL_PURPOSE_PROPERTIES",
};

// Per-step validation — thresholds mirror the backend CreatePropertyDto exactly:
//   propertyName: z.string().min(3)
//   description:  z.string().min(20)
//   yearBuilt:    z.coerce.number().int().min(1800).max(CURRENT_YEAR)
//   block / postalCode / state are optional — not validated here
export function stepIsValid(step: StepKey, form: FormState): boolean {
  const currentYear = new Date().getFullYear();
  switch (step) {
    case "basics":
      return (
        form.name.trim().length >= 3 && form.majorType.length > 0 && form.subtype.length > 0
      );
    case "location":
      return (
        form.address.trim().length > 0 &&
        form.city.trim().length > 0 &&
        form.country.trim().length > 0
      );
    case "details":
      return (
        Number(form.price) > 0 &&
        Number(form.area) > 0 &&
        Number(form.yearBuilt) >= 1800 &&
        Number(form.yearBuilt) <= currentYear &&
        form.description.trim().length >= 20
      );
    case "photos":
      return form.imageFiles.length > 0;
    case "review":
      return true;
    default:
      return true;
  }
}

export interface Amenity {
  icon: LucideIcon;
  label: string;
}

export const AMENITIES: Amenity[] = [
  { icon: Waves, label: "Swimming Pool" },
  { icon: TreePine, label: "Private Garden" },
  { icon: Wifi, label: "Smart Home" },
  { icon: ShieldCheck, label: "Gated Security" },
  { icon: Car, label: "Covered Parking" },
  { icon: Dumbbell, label: "Fitness Centre" },
  { icon: ChefHat, label: "Chef's Kitchen" },
  { icon: Sunset, label: "Rooftop Terrace" },
  { icon: Wind, label: "Central A/C" },
  { icon: Zap, label: "Solar Panels" },
  { icon: Star, label: "Concierge Service" },
  { icon: Leaf, label: "Eco Friendly" },
];

export const FEATURE_OPTIONS = [
  "Air Conditioning",
  "Central Heating",
  "Balcony / Terrace",
  "Private Elevator",
  "Storage Room",
  "Maid's Room",
  "Study / Home Office",
  "Walk-in Closet",
  "Built-in Wardrobes",
  "Pet Friendly",
  "Fully Furnished",
  "Semi Furnished",
  "24/7 Security",
  "CCTV Surveillance",
  "Intercom System",
  "Central Gas",
  "Sea View",
  "City View",
  "Garden View",
];

export const NEARBY = [
  "Al Mouj Marina — 3 min",
  "Golf Course — 5 min",
  "Retail Promenade — 4 min",
  "Muscat Int'l Airport — 20 min",
];
