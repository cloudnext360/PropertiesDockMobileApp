import { Placeholder } from "@/components/placeholder";
import { AccountShell } from "@/features/account/AccountShell";

export default function SettingsScreen() {
  return (
    <AccountShell active="settings">
      <Placeholder
        title="Settings"
        subtitle="Preferences, notifications, password & security."
        endpoint="GET/PUT /api/users/settings"
      />
    </AccountShell>
  );
}
