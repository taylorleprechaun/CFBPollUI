import { describe, expect, it } from 'vitest';

import type { CacheEntry } from '../../schemas/admin';

import { groupCacheEntriesByFamily } from '../../lib/group-cache-entries';

function makeEntry(overrides: Partial<CacheEntry>): CacheEntry {
  return {
    cachedAt: '2026-08-01T00:00:00Z',
    cacheKey: 'teams_2024',
    detail: '',
    expiresAt: '9999-12-31T23:59:59.9999999Z',
    family: 'Teams',
    season: 2024,
    sizeBytes: 100,
    ...overrides,
  };
}

describe('groupCacheEntriesByFamily', () => {
  it('places null-season entries after seasoned entries regardless of input order', () => {
    const nullFirst = [
      makeEntry({ cacheKey: 'conferences', family: 'Conferences', season: null }),
      makeEntry({ cacheKey: 'teams_2024', family: 'Conferences', season: 2024 }),
    ];
    const seasonedFirst = [
      makeEntry({ cacheKey: 'teams_2024', family: 'Conferences', season: 2024 }),
      makeEntry({ cacheKey: 'conferences', family: 'Conferences', season: null }),
    ];

    expect(groupCacheEntriesByFamily(nullFirst)[0].entries.map((e) => e.cacheKey)).toEqual(['teams_2024', 'conferences']);
    expect(groupCacheEntriesByFamily(seasonedFirst)[0].entries.map((e) => e.cacheKey)).toEqual(['teams_2024', 'conferences']);
  });

  it('returns an empty array for no entries', () => {
    expect(groupCacheEntriesByFamily([])).toEqual([]);
  });

  it('sorts entries with the same season by detail using natural (numeric) order', () => {
    const entries = [
      makeEntry({ cacheKey: 'bettingLines_2024_10', detail: 'Week 10', season: 2024 }),
      makeEntry({ cacheKey: 'bettingLines_2024_1', detail: 'Week 1', season: 2024 }),
      makeEntry({ cacheKey: 'bettingLines_2024_2', detail: 'Week 2', season: 2024 }),
    ];

    const result = groupCacheEntriesByFamily(entries);

    expect(result[0].entries.map((e) => e.detail)).toEqual(['Week 1', 'Week 2', 'Week 10']);
  });

  it('sorts entries within a family by season descending', () => {
    const entries = [
      makeEntry({ cacheKey: 'teams_2020', season: 2020 }),
      makeEntry({ cacheKey: 'teams_2024', season: 2024 }),
      makeEntry({ cacheKey: 'teams_2022', season: 2022 }),
    ];

    const result = groupCacheEntriesByFamily(entries);

    expect(result).toHaveLength(1);
    expect(result[0].entries.map((e) => e.season)).toEqual([2024, 2022, 2020]);
  });

  it('sorts families alphabetically', () => {
    const entries = [
      makeEntry({ cacheKey: 'teams_2024', family: 'Teams' }),
      makeEntry({ cacheKey: 'conferences', family: 'Conferences', season: null }),
      makeEntry({ cacheKey: 'calendar_2024', family: 'Calendar' }),
    ];

    const result = groupCacheEntriesByFamily(entries);

    expect(result.map((g) => g.family)).toEqual(['Calendar', 'Conferences', 'Teams']);
  });

  it('sums size in bytes per family', () => {
    const entries = [
      makeEntry({ cacheKey: 'teams_2024', sizeBytes: 100 }),
      makeEntry({ cacheKey: 'teams_2023', season: 2023, sizeBytes: 250 }),
    ];

    const result = groupCacheEntriesByFamily(entries);

    expect(result[0].totalSizeBytes).toBe(350);
  });
});
