import { describe, expect, it } from 'vitest';

import { getRawWeekLabel, getScoreOverrideWeekLabel, getWeekLabel } from '../../lib/week-utils';

describe('week-utils', () => {
  describe('getRawWeekLabel', () => {
    it('labels a postseason week as Postseason', () => {
      expect(getRawWeekLabel(15, true)).toBe('Postseason');
    });

    it('labels a regular-season week with its own number, no offset', () => {
      expect(getRawWeekLabel(2, false)).toBe('Week 2');
    });
  });

  describe('getScoreOverrideWeekLabel', () => {
    it('falls back to the played week when seasonType is missing', () => {
      expect(getScoreOverrideWeekLabel({ week: 3 })).toBe('Week 3');
    });

    it('labels a postseason override as Postseason regardless of its week number', () => {
      expect(getScoreOverrideWeekLabel({ seasonType: 'postseason', week: 1 })).toBe('Postseason');
    });

    it('labels a regular-season override with the week it was played, without the rankings offset', () => {
      expect(getScoreOverrideWeekLabel({ seasonType: 'regular', week: 3 })).toBe('Week 3');
    });
  });

  describe('getWeekLabel', () => {
    it('shifts the week number by one', () => {
      expect(getWeekLabel(2)).toBe('Week 3');
    });
  });
});
