/**
 * Compact timestamp for the conversation list — "now", "5m", "3h", "Yesterday",
 * a weekday within the last week, else a short date. Deliberately terser than
 * the shared `timeAgo` ("5 minutes ago"), which suits detail views not a list.
 */
export function formatConversationTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const then = new Date(iso);
  const ms = then.getTime();
  if (Number.isNaN(ms)) return "";

  const now = new Date();
  const diffSec = Math.max(0, Math.floor((now.getTime() - ms) / 1000));

  if (diffSec < 60) return "now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m`;

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfThen = new Date(then.getFullYear(), then.getMonth(), then.getDate()).getTime();
  const dayDiff = Math.round((startOfToday - startOfThen) / 86_400_000);

  if (dayDiff <= 0) return `${Math.floor(diffSec / 3600)}h`;
  if (dayDiff === 1) return "Yesterday";
  if (dayDiff < 7) return then.toLocaleDateString(undefined, { weekday: "short" });

  const sameYear = then.getFullYear() === now.getFullYear();
  return then.toLocaleDateString(
    undefined,
    sameYear ? { month: "short", day: "numeric" } : { month: "short", day: "numeric", year: "2-digit" },
  );
}

/** Clock time under a message bubble, e.g. "3:45 PM". */
export function formatMessageTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function isSameDay(a: string, b: string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

/** Day-separator label: "Today", "Yesterday", a weekday within a week, else a date. */
export function formatDayLabel(iso: string): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return "";
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfThen = new Date(then.getFullYear(), then.getMonth(), then.getDate()).getTime();
  const dayDiff = Math.round((startOfToday - startOfThen) / 86_400_000);

  if (dayDiff <= 0) return "Today";
  if (dayDiff === 1) return "Yesterday";
  if (dayDiff < 7) return then.toLocaleDateString(undefined, { weekday: "long" });

  const sameYear = then.getFullYear() === now.getFullYear();
  return then.toLocaleDateString(
    undefined,
    sameYear
      ? { month: "long", day: "numeric" }
      : { month: "long", day: "numeric", year: "numeric" },
  );
}
