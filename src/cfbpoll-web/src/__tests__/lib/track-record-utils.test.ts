import { describe, expect, it } from 'vitest';

import {
  combineMarginBias,
  combineMarginRMSE,
  formatMarginBias,
  formatMarginRMSE,
  formatTotals,
  sumTotals,
  winPercentage,
} from '../../lib/track-record-utils';

describe('combineMarginBias', () => {
  it('combines a count-weighted average across multiple weeks', () => {
    expect(combineMarginBias([
      { marginBias: 2, marginGameCount: 3 },
      { marginBias: -1, marginGameCount: 1 },
    ])).toBeCloseTo(1.25, 5);
  });

  it('ignores weeks with a null marginBias, since their count is 0', () => {
    expect(combineMarginBias([
      { marginBias: null, marginGameCount: 0 },
      { marginBias: 4, marginGameCount: 2 },
    ])).toBe(4);
  });

  it('returns null for an empty array', () => {
    expect(combineMarginBias([])).toBeNull();
  });
});

describe('combineMarginRMSE', () => {
  it('combines a count-weighted quadratic mean across multiple weeks', () => {
    expect(combineMarginRMSE([
      { marginRMSE: 2, marginGameCount: 2 },
      { marginRMSE: 4, marginGameCount: 2 },
    ])).toBeCloseTo(3.1623, 4);
  });

  it('ignores weeks with a null marginRMSE, since their count is 0', () => {
    expect(combineMarginRMSE([
      { marginRMSE: null, marginGameCount: 0 },
      { marginRMSE: 3, marginGameCount: 2 },
    ])).toBe(3);
  });

  it('returns null for an empty array', () => {
    expect(combineMarginRMSE([])).toBeNull();
  });
});

describe('formatMarginBias', () => {
  it('prefixes a plus sign for a positive value', () => {
    expect(formatMarginBias(3.2)).toBe('+3.2 pts');
  });

  it('relies on the negative sign already present for a negative value', () => {
    expect(formatMarginBias(-1.5)).toBe('-1.5 pts');
  });

  it('returns N/A for null', () => {
    expect(formatMarginBias(null)).toBe('N/A');
  });

  it('shows no sign for zero', () => {
    expect(formatMarginBias(0)).toBe('0.0 pts');
  });
});

describe('formatMarginRMSE', () => {
  it('formats a value to one decimal place with a pts suffix', () => {
    expect(formatMarginRMSE(8.34)).toBe('8.3 pts');
  });

  it('returns N/A for null', () => {
    expect(formatMarginRMSE(null)).toBe('N/A');
  });
});

describe('formatTotals', () => {
  it('appends the push segment when push is greater than zero', () => {
    expect(formatTotals({ correct: 10, incorrect: 4, push: 2 })).toBe('10-4-2');
  });

  it('formats all zeros without a push segment', () => {
    expect(formatTotals({ correct: 0, incorrect: 0, push: 0 })).toBe('0-0');
  });

  it('formats correct-incorrect without a push segment when push is zero', () => {
    expect(formatTotals({ correct: 10, incorrect: 4, push: 0 })).toBe('10-4');
  });
});

describe('sumTotals', () => {
  it('returns a copy of the single totals object when given one entry', () => {
    expect(sumTotals([{ correct: 3, incorrect: 2, push: 1 }])).toEqual({ correct: 3, incorrect: 2, push: 1 });
  });

  it('returns all zeros for an empty array', () => {
    expect(sumTotals([])).toEqual({ correct: 0, incorrect: 0, push: 0 });
  });

  it('sums correct, incorrect, and push across multiple totals', () => {
    expect(sumTotals([
      { correct: 5, incorrect: 0, push: 0 },
      { correct: 4, incorrect: 1, push: 0 },
      { correct: 2, incorrect: 1, push: 1 },
    ])).toEqual({ correct: 11, incorrect: 2, push: 1 });
  });
});

describe('winPercentage', () => {
  it('computes the percentage of correct picks among decided picks', () => {
    expect(winPercentage({ correct: 3, incorrect: 1, push: 0 })).toBe(75);
  });

  it('excludes pushes from the decided total', () => {
    expect(winPercentage({ correct: 1, incorrect: 1, push: 5 })).toBe(50);
  });

  it('returns 0 when all decided picks are incorrect', () => {
    expect(winPercentage({ correct: 0, incorrect: 4, push: 0 })).toBe(0);
  });

  it('returns null when there are no decided picks', () => {
    expect(winPercentage({ correct: 0, incorrect: 0, push: 3 })).toBeNull();
  });
});
