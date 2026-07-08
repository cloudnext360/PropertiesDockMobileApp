import { ScreenPlaceholder } from "@/components/screen-placeholder";

// NOTE: web calls POST /general-users (no /api prefix) and it is NOT in the backend
// router registry — confirm the real endpoint before wiring (MOBILE_PLAN.md §3/§4).
export default function CompleteProfileScreen() {
  return (
    <ScreenPlaceholder
      title="Complete your profile"
      subtitle="Create your GeneralUser profile after first sign-in."
      endpoint="POST /general-users  (⚠ verify backend)"
    />
  );
}
