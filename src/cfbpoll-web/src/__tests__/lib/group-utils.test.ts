import { describe, it, expect } from 'vitest';
import { groupBySeasonDescending } from '../../lib/group-utils';

describe('groupBySeasonDescending', () => {
  it('returns empty array for empty input', () => {
    const result = groupBySeasonDescending([]);

    expect(result).toEqual([]);
  });

  it('groups items by season in descending order', () => {
    const items = [
      { season: 2023, week: 1 },
      { season: 2024, week: 1 },
      { season: 2024, week: 3 },
    ];

    const result = groupBySeasonDescending(items);

    expect(result).toEqual([
      { season: 2024, weeks: [{ season: 2024, week: 3 }, { season: 2024, week: 1 }] },
      { season: 2023, weeks: [{ season: 2023, week: 1 }] },
    ]);
  });

  it('sorts weeks in descending order within each season', () => {
    const items = [
      { season: 2024, week: 1 },
      { season: 2024, week: 5 },
      { season: 2024, week: 3 },
    ];

    const result = groupBySeasonDescending(items);

    expect(result).toHaveLength(1);
    expect(result[0].weeks.map((w) => w.week)).toEqual([5, 3, 1]);
  });

  it('preserves additional properties on items', () => {
    const items = [
      { season: 2024, week: 1, isPublished: true, createdAt: '2024-01-01' },
    ];

    const result = groupBySeasonDescending(items);

    expect(result[0].weeks[0]).toEqual({
      season: 2024,
      week: 1,
      isPublished: true,
      createdAt: '2024-01-01',
    });
  });

  it('does not mutate the original array', () => {
    const items = [
      { season: 2024, week: 3 },
      { season: 2024, week: 1 },
    ];
    const originalOrder = [...items];

    groupBySeasonDescending(items);

    expect(items).toEqual(originalOrder);
  });

  it('handles single item', () => {
    const items = [{ season: 2024, week: 5 }];

    const result = groupBySeasonDescending(items);

    expect(result).toEqual([
      { season: 2024, weeks: [{ season: 2024, week: 5 }] },
    ]);
  });
});
