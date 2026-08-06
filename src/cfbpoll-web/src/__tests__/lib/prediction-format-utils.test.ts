import { describe, expect, it } from 'vitest';

import { formatOverUnder, formatPick, formatSpread } from '../../lib/prediction-format-utils';

describe('formatOverUnder', () => {
  it('returns N/A when value is null', () => {
    expect(formatOverUnder(null)).toBe('N/A');
  });

  it('returns N/A when value is undefined', () => {
    expect(formatOverUnder(undefined)).toBe('N/A');
  });

  it('returns the string representation of a value', () => {
    expect(formatOverUnder(48.5)).toBe('48.5');
  });
});

describe('formatPick', () => {
  it('returns N/A when the pick is an empty string', () => {
    expect(formatPick('')).toBe('N/A');
  });

  it('returns the pick when non-empty', () => {
    expect(formatPick('Over')).toBe('Over');
  });
});

describe('formatSpread', () => {
  it('formats a negative spread with the home team favored', () => {
    const result = formatSpread({ bettingSpread: -7.5, homeTeam: 'Ohio State' });

    expect(result).toBe('Ohio State -7.5');
  });

  it('formats a positive spread with a plus sign', () => {
    const result = formatSpread({ bettingSpread: 3.5, homeTeam: 'Iowa' });

    expect(result).toBe('Iowa +3.5');
  });

  it('returns N/A when bettingSpread is null', () => {
    const result = formatSpread({ bettingSpread: null, homeTeam: 'Texas' });

    expect(result).toBe('N/A');
  });
});
