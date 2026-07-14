import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { config } from "@/lib/config";

/** Same behaviour as web (PropertyDockFrontend/src/lib/utils.ts): clsx + tailwind-merge. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Port of web `resolveImageUrl`: backend serves uploads under `/uploads/...`;
 * prefix those with the API host, and pass absolute URLs through untouched.
 */
export function resolveImageUrl(url: string | null | undefined, fallback = ""): string {
  if (!url) return fallback;
  if (url.startsWith("/uploads/")) return `${config.apiUrl}${url}`;
  return url;
}

/**
 * Relative "time ago" string, e.g. "Just now", "3 hours ago", "1 day ago".
 * Hand-rolled rather than `Intl.RelativeTimeFormat` (Hermes support is spotty).
 * Future timestamps (clock skew) clamp to "Just now".
 */
export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";

  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 60) return "Just now";

  const units: [limit: number, secs: number, label: string][] = [
    [60, 60, "minute"],
    [24, 3600, "hour"],
    [7, 86400, "day"],
    [4.35, 604800, "week"],
    [12, 2629800, "month"], // avg month ≈ 30.44 days
    [Infinity, 31557600, "year"],
  ];

  for (const [limit, secs, label] of units) {
    const value = Math.floor(seconds / secs);
    if (value < limit) return `${value} ${label}${value === 1 ? "" : "s"} ago`;
  }
  return "";
}
