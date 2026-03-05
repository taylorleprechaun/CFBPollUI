export const GC_TIME_DEFAULT = 1000 * 60 * 30; // 30 minutes
export const STALE_TIME_RANKINGS = 1000 * 60 * 5; // 5 minutes
export const STALE_TIME_ALL_TIME = 1000 * 60 * 30; // 30 minutes
export const STALE_TIME_PAGE_VISIBILITY = 1000 * 60 * 30; // 30 minutes
export const STALE_TIME_POLL_LEADERS = 1000 * 60 * 30; // 30 minutes
export const STALE_TIME_SEASONS = 1000 * 60 * 60; // 1 hour
export const STALE_TIME_SNAPSHOTS = 1000 * 60 * 30; // 30 minutes
export const STALE_TIME_CONFERENCES = 1000 * 60 * 60 * 24; // 24 hours

// Historical seasons (before maxSeason) never change, so treat them as permanently fresh.
export function getStaleTime(season: number | null, maxSeason: number | null, defaultStaleTime: number): number {
  if (season !== null && maxSeason !== null && season < maxSeason) return Infinity;
  return defaultStaleTime;
}
