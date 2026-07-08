import { CURRENCY, DIAL_CODE, formatOmr, GOVERNORATES, LOCALE } from "@/constants/locale";

describe("Oman locale", () => {
  it("uses OMR / en-OM / +968", () => {
    expect(CURRENCY).toBe("OMR");
    expect(LOCALE).toBe("en-OM");
    expect(DIAL_CODE).toBe("+968");
  });

  it("lists the 11 governorates", () => {
    expect(GOVERNORATES).toHaveLength(11);
    expect(GOVERNORATES).toContain("Muscat");
  });
});

describe("formatOmr", () => {
  it("formats a price with the OMR currency and no fraction digits", () => {
    const out = formatOmr(450000);
    expect(out).toContain("OMR");
    expect(out).toContain("450,000");
    expect(out).not.toContain(".");
  });

  it("appends /mo for RENT listings only", () => {
    expect(formatOmr(1200, "OMR", "RENT").endsWith("/mo")).toBe(true);
    expect(formatOmr(1200, "OMR", "SALE").endsWith("/mo")).toBe(false);
    expect(formatOmr(1200).endsWith("/mo")).toBe(false);
  });
});
