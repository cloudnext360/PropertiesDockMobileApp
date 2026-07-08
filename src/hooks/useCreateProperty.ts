import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Platform } from "react-native";

import { apiPostFormData } from "@/lib/api";
import { MAJOR_TYPE_TO_API, type FormState, type PickedImage } from "@/taxonomy/property";

// Mobile port of web useCreateProperty (PropertyDockFrontend/src/hooks/useCreateProperty.ts).
// Backend route: POST /api/properties (multipart/form-data, multer field "images", max 15,
// JPEG/PNG/WebP ≤ 5 MB each). requireAuth — token attached by the axios interceptor.
// General-user listings (no agencyId) are created with status APPROVED (live immediately).

/** Shape returned inside the backend's { success: true, data: ... } envelope. */
export interface CreatedProperty {
  id: string;
  slug: string;
  propertyName: string;
  status: string;
}

/**
 * Multipart image part, per platform:
 *   native — RN FormData takes { uri, name, type } parts directly.
 *   web    — react-native-web needs a real Blob (picker URIs are blob:/data: URLs).
 */
async function appendImage(fd: FormData, img: PickedImage) {
  if (Platform.OS === "web") {
    const blob = await fetch(img.uri).then((r) => r.blob());
    fd.append("images", new File([blob], img.name, { type: img.type }));
  } else {
    fd.append("images", img as unknown as Blob);
  }
}

async function toFormData(form: FormState): Promise<FormData> {
  const fd = new FormData();

  // ── Core identity ────────────────────────────────────────────────────────────
  fd.append("propertyName", form.name);
  fd.append("description", form.description);
  fd.append("category", form.category === "Residential" ? "RESIDENTIAL" : "COMMERCIAL");
  fd.append("majorType", MAJOR_TYPE_TO_API[form.majorType] ?? form.majorType);
  fd.append("subType", form.subtype);
  fd.append("listingType", form.type === "Sale" ? "SALE" : "RENT");

  // ── Pricing ──────────────────────────────────────────────────────────────────
  fd.append("price", String(Number(form.price)));
  fd.append("currency", "OMR");
  fd.append("negotiable", String(form.negotiable)); // "true" | "false" — coerced in DTO

  // ── Dimensions ───────────────────────────────────────────────────────────────
  // NOTE: the DTO field is areaSqm (web sends areaSqft, which Zod strips — a known
  // drift flagged in MOBILE_PLAN.md §3; mobile sends the canonical name).
  fd.append("areaSqm", String(Number(form.area)));
  fd.append("yearBuilt", String(Number(form.yearBuilt)));
  if (form.beds) fd.append("bedrooms", String(Number(form.beds)));
  if (form.baths) fd.append("bathrooms", String(Number(form.baths)));

  // ── Location ─────────────────────────────────────────────────────────────────
  fd.append("address", form.address);
  fd.append("block", form.block); // optional — DTO accepts empty string
  fd.append("city", form.city);
  fd.append("postalCode", form.postalCode);
  fd.append("state", form.state);
  fd.append("country", form.country);

  // ── Arrays — append each value individually (multer reconstructs the array) ──
  form.amenities.forEach((a) => fd.append("amenities", a));
  form.features.forEach((f) => fd.append("features", f));

  // ── Images — the first file becomes isPrimary on the backend ────────────────
  for (const img of form.imageFiles) {
    await appendImage(fd, img);
  }

  return fd;
}

export function useCreateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (form: FormState) => {
      const res = await apiPostFormData<{ success: true; data: CreatedProperty }>(
        "/api/properties",
        await toFormData(form),
      );
      return res.data; // unwrap envelope so callers get CreatedProperty directly
    },
    onSuccess: () => {
      // "properties" prefix covers both ["properties","my"] and filtered lists —
      // a general-user listing goes live immediately, so search results change too.
      qc.invalidateQueries({ queryKey: ["properties"] });
    },
  });
}
