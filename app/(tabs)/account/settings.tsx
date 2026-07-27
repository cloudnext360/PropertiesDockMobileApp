import { AccountShell } from "@/features/account/AccountShell";
import { SettingsPanel } from "@/features/account/SettingsPanel";

export default function SettingsScreen() {
  return (
    <AccountShell active="settings">
      <SettingsPanel />
    </AccountShell>
  );
}
