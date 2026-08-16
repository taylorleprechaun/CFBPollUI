import { describe, expect, it } from 'vitest';

import { calculateZScores } from '../../lib/stats-utils';

describe('calculateZScores', () => {
  it('computes population z-scores relative to the mean', () => {
    const zScores = calculateZScores([50, 40, 30]);

    expect(zScores[0]).toBeCloseTo(1.2247, 4);
    expect(zScores[1]).toBeCloseTo(0, 4);
    expect(zScores[2]).toBeCloseTo(-1.2247, 4);
  });

  it('defaults to zero for every value when the standard deviation is zero', () => {
    const zScores = calculateZScores([40, 40, 40]);

    expect(zScores).toEqual([0, 0, 0]);
  });

  it('returns an empty array for empty input', () => {
    const zScores = calculateZScores([]);

    expect(zScores).toEqual([]);
  });
});
