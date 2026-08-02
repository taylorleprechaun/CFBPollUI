import { describe, it, expect } from 'vitest';
import { badgeColorClasses } from '../../lib/badge-colors';
import type { BadgeColor } from '../../lib/badge-colors';

describe('badgeColorClasses', () => {
  const cases: [BadgeColor, string][] = [
    ['blue', 'bg-blue-100'],
    ['gray', 'bg-gray-100'],
    ['green', 'bg-green-100'],
    ['red', 'bg-red-100'],
    ['yellow', 'bg-yellow-100'],
  ];

  it.each(cases)('returns classes containing %s -> %s', (color, expectedClass) => {
    expect(badgeColorClasses(color)).toContain(expectedClass);
  });

  it('returns the same reference classes for repeated calls with the same color', () => {
    expect(badgeColorClasses('green')).toBe(badgeColorClasses('green'));
  });
});
