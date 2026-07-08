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
