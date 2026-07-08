import { AuthGate } from "@/components/auth-gate";
import { ListPropertyWizard } from "@/features/sell/ListPropertyWizard";

// "Sell" tab = the List Property action (MOBILE_PLAN.md §6): auth-gated 5-step
// wizard. Unauthenticated users are redirected to /auth by AuthGate.
export default function SellScreen() {
  return (
    <AuthGate>
      <ListPropertyWizard />
    </AuthGate>
  );
}
