import { Placeholder } from "@/components/placeholder";

export default function ProfileScreen() {
  return (
    <Placeholder
      title="Profile"
      subtitle="Your public profile, bio, and avatar."
      endpoint="GET/PUT /api/users/me"
    />
  );
}
