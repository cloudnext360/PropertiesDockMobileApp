import { Redirect } from "expo-router";

// The Account tab opens straight into My Listings — the segmented tab strip
// (AccountShell) replaces the old menu-list landing screen, so there's no
// separate "overview" destination to land on.
export default function AccountIndex() {
  return <Redirect href="/account/listings" />;
}
