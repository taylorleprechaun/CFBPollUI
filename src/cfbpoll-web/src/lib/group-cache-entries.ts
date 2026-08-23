import type { CacheEntry } from '../schemas/admin';

export interface CacheEntryFamilyGroup {
  entries: CacheEntry[];
  family: string;
  totalSizeBytes: number;
}

export function groupCacheEntriesByFamily(entries: CacheEntry[]): CacheEntryFamilyGroup[] {
  const byFamily = new Map<string, CacheEntry[]>();
  for (const entry of entries) {
    const existing = byFamily.get(entry.family);
    if (existing) {
      existing.push(entry);
    } else {
      byFamily.set(entry.family, [entry]);
    }
  }

  return [...byFamily.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([family, familyEntries]) => {
      const sorted = [...familyEntries].sort((a, b) => {
        if (a.season !== b.season) {
          if (a.season === null) return 1;
          if (b.season === null) return -1;
          return b.season - a.season;
        }
        return a.detail.localeCompare(b.detail, undefined, { numeric: true });
      });

      return {
        entries: sorted,
        family,
        totalSizeBytes: sorted.reduce((sum, entry) => sum + entry.sizeBytes, 0),
      };
    });
}
