import { Placeholder } from "@/components/placeholder";

export default function SettingsScreen() {
  return (
    <Placeholder
      title="Settings"
      subtitle="Preferences, notifications, password & security."
      endpoint="GET/PUT /api/users/settings"
    />
  );
}
