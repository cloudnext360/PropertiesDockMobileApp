import {
  DEFAULT_FORM,
  MAJOR_TYPE_TO_API,
  PROPERTY_TYPES,
  stepIsValid,
  type FormState,
} from "@/taxonomy/property";

describe("property taxonomy mapping", () => {
  it("maps display major types to backend enum values", () => {
    expect(MAJOR_TYPE_TO_API["Apartment / Flat"]).toBe("APARTMENT_FLAT");
    expect(MAJOR_TYPE_TO_API["Villa / Bungalow"]).toBe("VILLA_BUNGALOW");
    expect(MAJOR_TYPE_TO_API["Office Buildings"]).toBe("OFFICE_BUILDINGS");
  });

  it("has a MAJOR_TYPE_TO_API entry for every major type in PROPERTY_TYPES", () => {
    const majorLabels = [
      ...Object.keys(PROPERTY_TYPES.Residential),
      ...Object.keys(PROPERTY_TYPES.Commercial),
    ];
    for (const label of majorLabels) {
      expect(MAJOR_TYPE_TO_API[label]).toBeDefined();
    }
  });

  it("exposes SCREAMING_SNAKE_CASE subtype enum values", () => {
    const subtypes = Object.values(PROPERTY_TYPES.Residential).flat();
    expect(subtypes.length).toBeGreaterThan(0);
    for (const s of subtypes) {
      expect(s.value).toMatch(/^[A-Z][A-Z_]+$/);
    }
    expect(PROPERTY_TYPES.Residential["Apartment / Flat"].map((s) => s.value)).toContain(
      "STUDIO_UNIT",
    );
  });
});

describe("stepIsValid — mirrors backend CreatePropertyDto thresholds", () => {
  const base: FormState = {
    ...DEFAULT_FORM,
    name: "Al Mouj Villa",
    majorType: "VILLA_BUNGALOW",
    subtype: "DETACHED_VILLA",
    address: "Street 1",
    city: "Muscat",
    country: "Oman",
    price: "450000",
    area: "300",
    yearBuilt: "2020",
    description: "A lovely spacious villa near the marina with great views.",
    imageFiles: [{ uri: "file://a.jpg", name: "a.jpg", type: "image/jpeg" }],
  };

  it("basics: requires name >= 3 and major/subtype", () => {
    expect(stepIsValid("basics", base)).toBe(true);
    expect(stepIsValid("basics", { ...base, name: "AB" })).toBe(false);
    expect(stepIsValid("basics", { ...base, majorType: "" })).toBe(false);
    expect(stepIsValid("basics", { ...base, subtype: "" })).toBe(false);
  });

  it("location: requires address, city, country", () => {
    expect(stepIsValid("location", base)).toBe(true);
    expect(stepIsValid("location", { ...base, address: "" })).toBe(false);
    expect(stepIsValid("location", { ...base, city: "  " })).toBe(false);
  });

  it("details: price>0, area>0, yearBuilt 1800..current, description>=20", () => {
    expect(stepIsValid("details", base)).toBe(true);
    expect(stepIsValid("details", { ...base, price: "0" })).toBe(false);
    expect(stepIsValid("details", { ...base, area: "0" })).toBe(false);
    expect(stepIsValid("details", { ...base, yearBuilt: "1799" })).toBe(false);
    expect(stepIsValid("details", { ...base, yearBuilt: String(new Date().getFullYear() + 1) })).toBe(false);
    expect(stepIsValid("details", { ...base, description: "too short" })).toBe(false);
  });

  it("photos: requires at least one image", () => {
    expect(stepIsValid("photos", base)).toBe(true);
    expect(stepIsValid("photos", { ...base, imageFiles: [] })).toBe(false);
  });

  it("review: always valid", () => {
    expect(stepIsValid("review", DEFAULT_FORM)).toBe(true);
  });
});
