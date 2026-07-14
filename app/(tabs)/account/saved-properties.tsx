import { AccountShell } from "@/features/account/AccountShell";
import { SavedList } from "@/features/account/SavedList";

export default function SavedPropertiesScreen() {
  return (
    <AccountShell active="saved">
      <SavedList />
    </AccountShell>
  );
}
