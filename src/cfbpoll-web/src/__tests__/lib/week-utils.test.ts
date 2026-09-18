import { describe, expect, it } from 'vitest';

import { getRawWeekLabel, getWeekLabel } from '../../lib/week-utils';

describe('week-utils', () => {
  describe('getRawWeekLabel', () => {
    it('labels a postseason week as Postseason', () => {
      expect(getRawWeekLabel(15, true)).toBe('Postseason');
    });

    it('labels a regular-season week with its own number, no offset', () => {
      expect(getRawWeekLabel(2, false)).toBe('Week 2');
    });
  });

  describe('getWeekLabel', () => {
    it('shifts the week number by one', () => {
      expect(getWeekLabel(2)).toBe('Week 3');
    });
  });
});
