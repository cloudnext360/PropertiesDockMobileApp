import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";

import { queryClient } from "@/lib/query-client";
import type { ApiProperty } from "@/types/api";

// Port of web src/lib/recentlyViewed.ts — same key + cap, backed by AsyncStorage.
const KEY = "pd_recently_viewed";
const MAX = 8;
const RECENT_KEY = ["recently-viewed"] as const;

export async function getRecentlyViewed(): Promise<ApiProperty[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ApiProperty[]) : [];
  } catch {
    return [];
  }
}

export async function addRecentlyViewed(property: ApiProperty): Promise<void> {
  try {
    const existing = await getRecentlyViewed();
    const updated = [property, ...existing.filter((p) => p.id !== property.id)].slice(0, MAX);
    await AsyncStorage.setItem(KEY, JSON.stringify(updated));
    // Refresh any mounted "Recently viewed" rows.
    queryClient.invalidateQueries({ queryKey: RECENT_KEY });
  } catch {
    // storage unavailable — ignore
  }
}

/** Reactive read for the Home row. */
export function useRecentlyViewed() {
  return useQuery({ queryKey: RECENT_KEY, queryFn: getRecentlyViewed, staleTime: 0 });
}
