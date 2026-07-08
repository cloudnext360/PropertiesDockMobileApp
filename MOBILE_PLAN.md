# PropertyDock Mobile — Build Plan

A React Native (Expo) app for the PropertyDock marketplace, porting the
`propertydocknext` web frontend. This is a **plan only** — no app code yet.

**Context sources:** `PropertyDockFrontend/PROJECT_CONTEXT.md`,
`propertydockbackendnew/PROJECT_CONTEXT.md`, and the live web/backend repos.

**Repo situation (verified):** `D:\PropertyDock` is **not** a git repo. Each app
(`PropertyDockFrontend`, `propertydockbackendnew`, `PropertyDockAdmin`, `agency-hub`) is
its **own** git repo — a polyrepo. `PropertyDockMobile` exists but is empty. This shapes
the code-sharing recommendation in §5.

> **Recommended runtime:** Expo (SDK-managed) + **Expo Router** (file-based routing — the
> closest mental model to the web's Next.js App Router) + React Native's New Architecture.
> This is assumed throughout.

---

## 1. Web → Mobile Library Mapping

### Direct, clean ports

| Web (`propertydocknext`) | Mobile | Notes |
|---|---|---|
| `@tanstack/react-query` v5 | **same package** | Identical API in RN. Hooks port 1:1 (see §3). |
| `react-hook-form` + `@hookform/resolvers` | same | Works in RN unchanged. |
| `zod` | same | Pure — shared package candidate (§5). |
| `axios` | same | Works, but token storage + JWT decode change (see below). |
| `date-fns` | same | Pure. |
| `clsx` + `tailwind-merge` + `class-variance-authority` | same | `cn()` + `cva` are exactly how **React Native Reusables** works. |
| `lucide-react` | **lucide-react-native** ✓ | Same icon names — mechanical swap. |
| `next/image` | **expo-image** ✓ | `resolveImageUrl()` logic ports as-is. |
| `sonner` | **sonner-native** ✓ | Confirmed choice. |
| `motion` (Framer Motion) | **Moti** (+ `react-native-reanimated`) ✓ | Framer Motion has no RN renderer; Moti is the idiomatic mapping. |
| `recharts` | **victory-native** ✓ | recharts is DOM/SVG-web only. victory-native (Skia) for InvestMarketTrends. |
| Tailwind + shadcn/ui + `@radix-ui/*` | **NativeWind** + **React Native Reusables** ✓ | RNR replaces both shadcn and the Radix primitives (Radix has no RN port). |
| Plus Jakarta Sans via `next/font` | **expo-font** + `@expo-google-fonts/plus-jakarta-sans` | See font-weight caveat in §2. |

### Confirmed choices with a caveat

| Web | Mobile | Caveat |
|---|---|---|
| `BuyMapView` (web map) | **react-native-maps** ✓ | Needs a Google Maps API key + `app.json` config (iOS/Android). Property lat/long already exist on `ApiPropertyDetail`. |
| `next-themes` | NativeWind `colorScheme` / `useColorScheme` | No `next-themes` on RN. Web currently forces **light + system disabled** (`providers.tsx`), so mobile can default to light and keep dark tokens ready. |

### ⚠ No clean 1:1 path — needs a decision / replacement

| Web dependency | Problem | Proposed mobile approach |
|---|---|---|
| **`embla-carousel-react`** (PropertySlideShow, PropertyGallery, carousel.tsx) | DOM-only. | `react-native-reanimated-carousel`, or a paged `FlatList`. |
| **`vaul`** (drawer) + Radix Dialog/Sheet | DOM-only. | `@gorhom/bottom-sheet` (RNR wraps it) for sheets/drawers. |
| **`react-day-picker`** (calendar.tsx, visit scheduling) | DOM-only. | `@react-native-community/datetimepicker` or a RNR date field. |
| **`input-otp`** (2FA / OTP) | DOM-only. | `react-native-otp-entry` or RNR OTP input. |
| **`cmdk`** (command palette) | Desktop UX pattern. | Drop for mobile; replace with a normal search screen. |
| **`react-resizable-panels`** | Desktop-only layout. | Not applicable — drop. |
| **Material Symbols Outlined** (CDN `<link>` in `layout.tsx`, `.material-symbols-outlined`) | CDN icon font won't load in RN. | Replace those usages with `lucide-react-native` (or `@expo/vector-icons`). Audit for `material-symbols-outlined` class usage during port. |
| **`localStorage`** token store (`lib/api.ts`, `AuthContext`) | No `localStorage` in RN. | **expo-secure-store** (preferred for tokens) or AsyncStorage. Makes token reads **async** → the axios request/refresh interceptors must become async. |
| **`atob`** for JWT decode (`AuthContext.decodeJwt`) | No `atob` in RN. | `jwt-decode` lib, or a base64 polyfill. |
| **`FormData` with `File`/`Blob`** (register avatar, property images, verification docs) | RN uses `{ uri, name, type }` parts, not `File`. | Rework the 3 multipart builders (`register`, `useCreateProperty`, `useUploadDoc`) for RN FormData + `expo-image-picker`. |
| `next/link`, `next/navigation` | Framework-specific. | Expo Router `Link`, `useRouter`, `useLocalSearchParams`. |

**Bottom line:** the data layer (React Query + axios + zod + types) ports almost untouched;
the presentation layer (Radix/shadcn/embla/vaul/next-image) is a rebuild on NativeWind + RNR;
three cross-cutting seams — **token storage, JWT decode, and multipart uploads** — need
explicit rework.

---

## 2. Design Tokens (extracted from `globals.css` + `tailwind.config.ts`)

NativeWind v4 supports the same `hsl(var(--token))` + `.dark` pattern, so these port
directly into the mobile `tailwind.config` + a CSS/`vars()` theme. Values are raw HSL
channels (as authored).

### Semantic colors — Light (`:root`) and Dark (`.dark`)

| Token | Light | Dark |
|---|---|---|
| `background` | `160 15% 94%` | `222.2 84% 4.9%` |
| `foreground` | `220 8% 29%` | `210 40% 98%` |
| `brand` | `213 100% 12%` | *(unchanged — see note)* |
| `brand-foreground` | `160 23% 98%` | *(unchanged)* |
| `brand-dark` | `180 100% 16%` | *(unchanged)* |
| `card` | `0 0% 100%` | `222.2 84% 4.9%` |
| `card-foreground` | `222.2 84% 4.9%` | `210 40% 98%` |
| `popover` | `0 0% 100%` | `222.2 84% 4.9%` |
| `popover-foreground` | `222.2 84% 4.9%` | `210 40% 98%` |
| `primary` | `222.2 47.4% 11.2%` | `210 40% 98%` |
| `primary-foreground` | `210 40% 98%` | `222.2 47.4% 11.2%` |
| `secondary` | `210 40% 96.1%` | `217.2 32.6% 17.5%` |
| `secondary-foreground` | `222.2 47.4% 11.2%` | `210 40% 98%` |
| `muted` | `160 20% 96%` | `217.2 32.6% 17.5%` |
| `muted-foreground` | `220 8% 48%` | `215 20.2% 65.1%` |
| `accent` | `210 40% 96.1%` | `217.2 32.6% 17.5%` |
| `accent-foreground` | `222.2 47.4% 11.2%` | `210 40% 98%` |
| `destructive` | `0 84.2% 60.2%` | `0 62.8% 30.6%` |
| `destructive-foreground` | `210 40% 98%` | `210 40% 98%` |
| `border` | `214.3 31.8% 91.4%` | `217.2 32.6% 17.5%` |
| `input` | `214.3 31.8% 91.4%` | `217.2 32.6% 17.5%` |
| `ring` | `222.2 84% 4.9%` | `212.7 26.8% 83.9%` |
| `sidebar-background` | `0 0% 98%` | `240 5.9% 10%` |
| `sidebar-foreground` | `240 5.3% 26.1%` | `240 4.8% 95.9%` |
| `sidebar-primary` | `240 5.9% 10%` | `224.3 76.3% 48%` |
| `sidebar-primary-foreground` | `0 0% 98%` | `0 0% 100%` |
| `sidebar-accent` | `240 4.8% 95.9%` | `240 3.7% 15.9%` |
| `sidebar-accent-foreground` | `240 5.9% 10%` | `240 4.8% 95.9%` |
| `sidebar-border` | `220 13% 91%` | `240 3.7% 15.9%` |
| `sidebar-ring` | `217.2 91.2% 59.8%` | `217.2 91.2% 59.8%` |

> **Note — `brand*` is NOT redefined in dark mode.** It stays the light value. Treat brand as
> a mode-invariant constant. `sidebar` tokens are dashboard-web chrome; on mobile the
> dashboard becomes the Account tab (§6), so most sidebar tokens are likely unused — port
> lazily.

### Non-semantic tokens (glass / shadows / scoped themes)

- **Glass:** `--glass: 0 0% 100% / 0.65`, `--glass-border: 0 0% 100% / 0.4` (used by
  `.glass-nav` / `.glass-panel` navbar/dropdowns). RN has no `backdrop-blur` in core →
  use **expo-blur** (`BlurView`) where the frosted effect matters.
- **Shadows:** `--shadow-glass: 0 8px 32px -4px hsl(220 8% 29% / 0.12)`,
  `--shadow-elegant: 0 20px 50px -12px hsl(220 8% 29% / 0.25)`. RN shadows differ per
  platform (`shadowColor/Offset/Opacity/Radius` + `elevation`) — approximate, don't copy.
- **`.invest-page-theme` (scoped override):** `primary 213 100% 12%`, `primary-foreground
  160 23% 98%`, `secondary 180 85% 22%`, `secondary-foreground 160 23% 98%`. Apply as a
  themed provider on the **Invest stack** (§6).
- **Ad-hoc surface classes** (hardcoded, outside the token system — port if their
  components come over): `bg-surface-container-low: hsl(213 30% 97%)`,
  `bg-secondary-fixed: hsl(180 60% 92%)`, `bg-secondary-container: hsl(180 55% 86%)`,
  `text-on-surface: hsl(213 100% 12%)`, `text-on-surface-variant: hsl(220 8% 46%)`,
  `text-on-secondary-fixed-variant: hsl(180 85% 20%)`, `grainy-bg` gradient
  `hsl(213 100% 10%) → hsl(180 100% 14%)`.

### Radii (`--radius: 0.5rem`)

| Tailwind key | Formula | Mobile px |
|---|---|---|
| `lg` | `var(--radius)` | **8** |
| `md` | `radius - 2px` | **6** |
| `sm` | `radius - 4px` | **4** |

### Typography — Plus Jakarta Sans

Weights **actually loaded** (`app/layout.tsx`): **200, 300, 400, 500, 600, 700, 800**.
All font roles (`sans`, `display`, `headline`, `body`, `label`) map to Plus Jakarta Sans.

> **RN caveat:** React Native does not resolve numeric `fontWeight` to font files
> automatically. Register each weight via `@expo-google-fonts/plus-jakarta-sans`
> (`PlusJakartaSans_200ExtraLight` … `_800ExtraBold`) and either (a) map families in
> NativeWind, or (b) use the variable font. Don't assume `font-weight: 600` "just works".

---

## 3. React Query Hooks & API Shapes — Portability

All hooks depend only on `apiGet/apiPost/…` (from `lib/api`) + React Query — both
platform-agnostic. **Every hook ports 1:1 once `lib/api` is reimplemented for RN** (async
token storage). The pure mapping helpers (`toFrontend`, `mapStatus`, `primaryImage`,
`resolveImageUrl`, `buildFullDocList`) port verbatim.

| Hook | Query key | Endpoint(s) | Ports? |
|---|---|---|---|
| `useProperties(filters)` | `["properties", filters]` | `GET /api/properties?<qs>` | ✅ direct |
| `usePropertyBySlug(slug)` | `["property","slug",slug]` | `GET /api/properties/slug/:slug` | ✅ direct |
| `useMyProperties()` | `["properties","my"]` | `GET /api/properties/my` (auth) | ✅ direct |
| `useInquiries()` | `["inquiries"]` | `GET /api/inquiries/me?direction=received` + `=sent` | ✅ direct |
| `useFullProfile()` | `["profile","me"]` | `GET /api/users/me` (auth) | ✅ direct |
| `useAgencyBySlug(slug)` | `["agency-by-slug",slug]` | `GET /api/agencies/public/:slug` | ✅ direct |
| `useSavedProperties()` | `["saved-properties"]` | `GET /saved-properties` | ⚠ **endpoint gap** |
| `useVerificationDocs()` | `["verification-docs"]` | `GET /verification/documents` | ⚠ **endpoint gap** |

Companion mutations that also port: `useCreateProperty` (`POST /api/properties`,
multipart), `useDeleteProperty`, `useRespondToInquiry` (`POST /api/inquiries/:id/respond`),
`useCloseInquiry` (`PATCH /api/inquiries/:id/close`), `useSaveProperty` /
`useRemoveSavedProperty`, `useUploadDoc`, `useUpdateProfile`, `useUpdateBio`,
`useChangePassword`, `useUserSettings`.

> ⚠ **Verified gap:** `useSavedProperties`, `useVerificationDocs`, and
> `AuthContext.createGeneralProfile` call **`/saved-properties`**, **`/verification/documents`**,
> and **`/general-users`** — with **no `/api` prefix**, and none of these routers is mounted
> in the backend's `app.ts`, nor do `SavedProperty` / `VerificationDoc` models exist in
> `schema.prisma`. **Before building the Saved and Verification screens, confirm whether
> these endpoints exist on the deployed backend** (they may be unimplemented or served
> elsewhere). Don't assume they work.

### API shapes reusable **as-is** (plain TS interfaces, zero DOM deps → 100% reusable)

- **From `types/profile.ts`:** `ApiProperty`, `ApiPropertyDetail`, `ApiPropertyImage`,
  `ApiPropertyOwner`, `ApiPropertyAgencyMember`, `FullUser`, `PublicUser`,
  `AgencyMembership`, `PublicUserAgencyMembership`.
- **From `types/dashboard.ts`:** `Inquiry`, `SavedProperty`, `VerificationDoc` (+ statuses).
- **From `AuthContext`:** `GeneralUserProfile`, `AuthUser`, `RegisterPayload`,
  `FieldValidationError`, `EmailNotVerifiedError` (error classes port too).
- **From `useProperties`:** `PropertyFilters` (the query-param contract).

These interfaces are the single strongest argument for the shared package (§5).

---

## 4. Endpoint Catalog per Screen

**Response envelopes (backend `utils/response.ts`):**
- Object: `{ success, message, data }`
- Paginated (via `sendPaginated`): `{ success, data: [...], pagination: { total, page, limit, totalPages } }`
- Errors: `{ success:false, message, errors?: { field: [msg] } }`; some carry `errorCode`.

> ⚠ **Envelope inconsistency to handle in the client:** `GET /api/properties` returns a
> **top-level `pagination`** (sendPaginated), but `GET /api/properties/my` and
> `GET /api/inquiries/me` **nest** the paginated object **inside `data`**
> (`data: { items, total, page, limit, totalPages }`). The shared client must handle both.

| Screen | Method & Path | Auth | Request | Response `data` |
|---|---|---|---|---|
| **Sign in** | `POST /api/auth/login` | — | `{ email, password }` | `{ accessToken, refreshToken, user }` · 403 `errorCode:EMAIL_NOT_VERIFIED` |
| **Sign up** | `POST /api/auth/register` | — | multipart: `email,password,firstName,lastName,phone,avatar?` | `{ message }` |
| Token refresh | `POST /api/auth/refresh` | — | `{ refreshToken }` | `{ accessToken, refreshToken }` |
| Logout | `POST /api/auth/logout` | — | `{ refreshToken }` | — |
| Resend verify | `POST /api/auth/resend-verification` | — | `{ email }` | — |
| Forgot / reset pw | `POST /api/auth/forgot-password` · `POST /api/auth/reset-password` | — | `{ email }` · `{ token, password }` | — |
| **Complete profile** | `POST /general-users` ⚠ | auth | `{ bio }` | `GeneralUserProfile` |
| Session restore | `GET /api/users/me` | auth | — | `FullUser` |
| **Home** | `GET /api/properties?isFeatured=true` | opt | filters | `ApiProperty[]` + `pagination` |
| **Buy (list + map)** | `GET /api/properties?<PropertyFilters>` | opt | `listingType,category,majorType,subType,city,minPrice,maxPrice,bedrooms,bathrooms,page,limit,sortBy,search` | `ApiProperty[]` + `pagination` |
| **Property detail** | `GET /api/properties/slug/:slug` (or `GET /api/properties/:id`, optionalAuth) | opt | — | `ApiPropertyDetail` |
| — submit inquiry | `POST /api/inquiries` | — | `{ propertyId, name, email, phone?, message }` | `Inquiry` |
| — save / unsave | `POST /saved-properties/:propertyId` · `DELETE /saved-properties/:savedId` ⚠ | auth | — | `SavedProperty` |
| — agency panel | `GET /api/agencies/public/:slug` | — | — | agency public profile |
| **List Property wizard** | `POST /api/properties` | auth | multipart (`images[]`, first = primary) + property fields | `{ id, slug, propertyName, status }` |
| — workflow | `POST /api/properties/:id/{submit,approve,reject}` · `PATCH /api/properties/:id/sold` | auth | reject: `{ reason }` | property |
| **Account · Profile** | `GET /api/users/me` · `PUT /api/users/me` · `GET/PUT /api/users/settings` | auth | profile fields / settings | `FullUser` / settings |
| **Account · My Listings** | `GET /api/properties/my` · `PUT`/`DELETE /api/properties/:id` | auth | — | `{ items,total,page,limit,totalPages }` (nested) |
| **Account · Inquiries** | `GET /api/inquiries/me?direction=received\|sent` · `POST /:id/respond` · `PATCH /:id/close` | auth | `{ response }` | nested paginated |
| **Account · Saved** | `GET /saved-properties` ⚠ | auth | — | `SavedProperty[]` |
| **Account · Verification** | `GET /verification/documents` · `POST /verification/documents` ⚠ | auth | multipart `{ file, docType }` | `VerificationDoc[]` |
| **Account · Security** | `POST /api/auth/change-password` · `GET /api/auth/security` · `/sessions` · `/2fa/*` | auth | varies | sessions / 2FA (defer to v2) |
| Locale/config (opt) | `GET /api/config/oman` | — | — | `{ governorates, features, amenities, defaults }` |

### Taxonomy that MUST stay in sync (`ListProperty/types.ts` ↔ backend enums)

- `category`: `RESIDENTIAL | COMMERCIAL` (= `PropertyCategory`)
- `listingType`: `SALE | RENT` (= `PropertyListingType`)
- `MAJOR_TYPE_TO_API`: display label → `PropertyMajorType` enum
- `PROPERTY_TYPES`: full tree of `{ label, value }` where `value` = `PropertySubType` enum
- Per-step validation in `stepIsValid` mirrors backend `CreatePropertyDto` (name ≥3,
  description ≥20, yearBuilt 1800–current, ≥1 image).

> ⚠ **Drift found — `area` field:** the web form/`useCreateProperty` sends **`areaSqft`**,
> but `CreatePropertyDto` + Prisma expect **`areaSqm`** (`ApiProperty` even types it
> `areaSqft`). The form value likely never reaches the DB. **Reconcile this in the shared
> package** so mobile doesn't inherit the bug.

### Oman locale that MUST stay in sync (`constants/locale.ts` ↔ `config/oman.ts`)

`COUNTRY="Oman"`, `CURRENCY="OMR"`, `LOCALE="en-OM"`, `DIAL_CODE="+968"`,
`PHONE_PLACEHOLDER`, `GOVERNORATES` (11), `formatOmr(price, currency?, listingType?)`
(appends `/mo` for RENT). Money is `Decimal(_,3)` (OMR → baisa) on the backend — preserve
3-decimal handling.

> ⚠ **Drift found — governorate spelling:** frontend `locale.ts` says **"Al Dakhiliyah"**
> while backend `config/oman.ts` says **"Al Dakhliyah"**. A shared list eliminates this
> class of bug outright.

---

## 5. Code-Sharing Strategy — Recommendation

**Recommendation: stand up a lightweight monorepo at `D:\PropertyDock` with a shared
package, and adopt it incrementally — starting with the pure, high-drift-risk artifacts.
Do NOT copy code into the app.**

### Why (evidence-driven)

In the span of writing this plan I found **four concrete drifts** that only exist because
web and backend maintain parallel copies of the same contracts:

1. `areaSqft` (web) vs `areaSqm` (backend DTO/schema).
2. `"Al Dakhiliyah"` (web) vs `"Al Dakhliyah"` (backend) governorate spelling.
3. `/saved-properties`, `/verification/documents`, `/general-users` called without `/api`
   and absent from the backend router registry.
4. Two different pagination envelope shapes for list endpoints.

Adding a mobile client via **copy** turns 2 drifting sources into **4**. A shared package
makes the taxonomy, locale, types, and zod schemas a **single source of truth** that web
and app physically import — they *can't* diverge.

### Proposed shape

```
D:\PropertyDock\                      # becomes workspace root (npm/pnpm workspaces + Turborepo)
├── packages/
│   └── core/  (@propertydock/core)   # platform-agnostic, ZERO react-native/next imports
│       ├── types/        # ApiProperty, ApiPropertyDetail, FullUser, PublicUser, Inquiry, …
│       ├── schemas/      # zod DTOs (CreateProperty, Login, Register, Inquiry, …)
│       ├── taxonomy/     # PROPERTY_TYPES, MAJOR_TYPE_TO_API, category, listingType
│       ├── locale/       # OMR, en-OM, +968, GOVERNORATES, formatOmr()
│       └── api/          # query-key factory + hooks, over an injected ApiClient interface
├── PropertyDockFrontend/     (consumes @propertydock/core)
├── PropertyDockMobile/       (consumes @propertydock/core)
├── propertydockbackendnew/   (can consume schemas/taxonomy/locale later)
└── PropertyDockAdmin, agency-hub  (migrate later)
```

**The one platform-specific seam:** the API transport. Define an `ApiClient` interface
(`get/post/put/patch/postFormData`) in `core`; each app injects its impl:

- **Web:** axios + `localStorage` tokens + `atob` JWT decode (existing `lib/api.ts`).
- **Mobile:** axios + `expo-secure-store` tokens (async) + `jwt-decode` + RN FormData.

The React Query hooks (§3) live in `core` and receive the client — so `useProperties`,
`usePropertyBySlug`, etc. are written **once**.

### Migration approach (pragmatic, low-disruption)

Because these are **separate git repos today**, don't force a big-bang migration:

1. **Phase 1 (do first):** create the workspace root + `@propertydock/core` containing only
   `types`, `schemas`, `taxonomy`, `locale`. Point **mobile** (greenfield) at it immediately;
   fix the 4 drifts here as the canonical version.
2. **Phase 2:** move the shared hooks + `ApiClient` interface into `core`; refactor web's
   `lib/api.ts` to provide the web impl. Web now consumes `core` too.
3. **Phase 3 (optional):** backend imports `schemas`/`taxonomy`/`locale`; admin + agency-hub
   migrate as convenient.

**Rejected alternative — copy into the app:** fastest to start, but guarantees the drift
above metastasizes across now-4 clients, and every enum/locale/endpoint change becomes an
N-place manual edit. Not acceptable for contracts that are already drifting.

> Decision needed from you: **Turborepo + pnpm workspaces** (recommended) vs plain npm
> workspaces. And confirm you're willing to bring the existing repos under one root
> (Phase 2+), or want mobile to consume a published/internal `core` package instead.

---

## 6. Mobile Information Architecture

**Navigation:** Expo Router with a bottom **tab layout** mirroring the web primary nav
(`navItems`: Buy, Sell, Rent, Invest) + the persistent **"List Property"** CTA, with the
entire web `/dashboard/*` folded into an **Account** tab.

Web nav mapping decisions:
- **"Rent"** is a dead `href:"#"` link on web → **not a tab**; it becomes a `listingType=RENT`
  filter inside the Buy/Search tab.
- **"Sell"** (`/sell`) is marketing; the real action is **"List Property"** (`/sell/list`).
  On mobile the **center tab is the List action** (marketing sell content, if needed, lives
  as a screen). Mirrors web `handleListProperty`: `user ? wizard : sign-in`.

### Tabs (5) + stacks

```
(tabs)/
├── home/                     # Tab 1 — "Home"
│   ├── index                 # hero + FeaturedProperties (GET /api/properties?isFeatured=true)
│   │                         #   + RecentlyViewed (local; AsyncStorage port of recentlyViewed.ts)
│   └── property/[slug]       # shared detail route (also reachable from Search)
│
├── search/                   # Tab 2 — "Buy" (Search/Explore)
│   ├── index                 # BuyFilters + results list  (GET /api/properties?<filters>)
│   ├── map                   # react-native-maps view of same query (lat/long)
│   ├── property/[slug]       # PropertyDetail + inquiry form (POST /api/inquiries) + save
│   └── agency/[slug]         # public agency profile (GET /api/agencies/public/:slug)
│
├── list/                     # Tab 3 — "List Property" (center CTA)  [auth-gated]
│   └── new                   # 5-step wizard: basics→location→details→photos→review
│                             #   (POST /api/properties, multipart). Unauth → redirect to auth.
│
├── invest/                   # Tab 4 — "Invest"  [invest-page-theme provider]
│   ├── index                 # opportunities + off-plan
│   └── trends                # InvestMarketTrends (victory-native)
│
└── account/                  # Tab 5 — "Account"  (folds ALL of web /dashboard/*)
    ├── index                 # if unauth → sign-in entry; else profile summary + menu
    ├── profile               # GET/PUT /api/users/me, bio, avatar
    ├── listings              # GET /api/properties/my (personal vs agency split)
    ├── inquiries             # GET /api/inquiries/me (received/sent), respond, close
    ├── saved                 # ⚠ GET /saved-properties (verify backend first)
    ├── verification          # ⚠ /verification/documents (verify backend first)
    ├── settings              # GET/PUT /api/users/settings
    └── security              # change password; 2FA + sessions (defer to v2)

Outside tabs (modal / auth group):
(auth)/
├── sign-in                   # POST /api/auth/login  (handle EMAIL_NOT_VERIFIED)
├── sign-up                   # POST /api/auth/register (multipart avatar)
├── verify-email              # resend verification
├── forgot-password / reset-password
└── complete-profile          # ⚠ POST /general-users  (create GeneralUser)
```

### Auth & gating

- `AuthContext` ports as a React context/provider (or a small Zustand store) backed by
  **expo-secure-store**. Session restore = decode stored access token (`jwt-decode`) →
  fetch `GET /api/users/me`.
- **Account tab** renders sign-in when unauthenticated (no separate always-visible auth tab).
- **List tab** and all `account/*` sub-screens are guarded → redirect to `(auth)/sign-in`.
- The web "profile incomplete" nudge (no `generalUser`) → surface on the Account index with
  a link to `complete-profile`.

### Open IA questions for you

1. **List** as a 5th bottom tab vs a floating center CTA button? (Tab is simpler in Expo
   Router; center-FAB is the flashier pattern.)
2. Keep a dedicated **Sell** marketing screen, or drop it and keep only the List action?
3. Is **Saved** or **Verification** in scope for v1 given the backend-endpoint gap (§3/§4)?

---

## Pre-Build Checklist (blocking questions)

1. **Endpoint gap:** confirm `/saved-properties`, `/verification/documents`, `/general-users`
   exist on the deployed backend (and their exact prefixes), or scope those screens out of v1.
2. **Monorepo:** approve Turborepo + pnpm workspaces and the incremental migration (§5)?
3. **Drift fixes:** OK to canonicalize `areaSqm` and the governorate spelling in `core`
   (and file a fix against web/backend)?
4. **Maps:** provision a Google Maps API key for `react-native-maps` (iOS + Android).
5. **Theme:** light-only (match web today) or enable system dark using the dark tokens now?
```
