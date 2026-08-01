import { describe, it, expect } from 'vitest';
import { formatTotals, winPercentage } from '../../lib/track-record-utils';

describe('formatTotals', () => {
  it('formats correct-incorrect without a push segment when push is zero', () => {
    expect(formatTotals({ correct: 10, incorrect: 4, push: 0 })).toBe('10-4');
  });

  it('appends the push segment when push is greater than zero', () => {
    expect(formatTotals({ correct: 10, incorrect: 4, push: 2 })).toBe('10-4-2');
  });

  it('formats all zeros without a push segment', () => {
    expect(formatTotals({ correct: 0, incorrect: 0, push: 0 })).toBe('0-0');
  });
});

describe('winPercentage', () => {
  it('computes the percentage of correct picks among decided picks', () => {
    expect(winPercentage({ correct: 3, incorrect: 1, push: 0 })).toBe(75);
  });

  it('excludes pushes from the decided total', () => {
    expect(winPercentage({ correct: 1, incorrect: 1, push: 5 })).toBe(50);
  });

  it('returns null when there are no decided picks', () => {
    expect(winPercentage({ correct: 0, incorrect: 0, push: 3 })).toBeNull();
  });

  it('returns 0 when all decided picks are incorrect', () => {
    expect(winPercentage({ correct: 0, incorrect: 4, push: 0 })).toBe(0);
  });
});
