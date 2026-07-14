/** Shared accent for the whole onboarding flow — matches the native splash background
 *  (app.json → expo-splash-screen backgroundColor) so the handoff is seamless. */
export const ONBOARDING_ACCENT = "#208AEF";
export const ONBOARDING_ACCENT_DEEP = "#0A57A8";
export const ONBOARDING_ACCENT_LIGHT = "#AEE1FF";

export interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  /** Remote hero photo (cached by expo-image after first load). */
  image: string;
}

// Soft neutral blurhash shown while the hero photos stream in.
export const SLIDE_BLURHASH = "LEHV6nWB2yk8pyo0adR*.7kCMdnj";

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: "find",
    title: "Find your dream home",
    description:
      "Browse verified villas, apartments and plots across Oman — curated for your lifestyle and budget.",
    image:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1080&q=80",
  },
  {
    id: "tour",
    title: "Tour it your way",
    description:
      "Book viewings in a tap and talk directly with trusted agents and agencies — on your schedule.",
    image:
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1080&q=80",
  },
  {
    id: "move",
    title: "Move in with confidence",
    description:
      "Transparent OMR pricing, verified listings and secure deals — from first visit to final signature.",
    image:
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1080&q=80",
  },
];
