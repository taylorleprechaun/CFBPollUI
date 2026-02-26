import { describe, it, expect } from 'vitest';
import { GC_TIME_DEFAULT, getStaleTime, STALE_TIME_RANKINGS } from '../../lib/query-config';

describe('query-config', () => {
  describe('GC_TIME_DEFAULT', () => {
    it('is 30 minutes in milliseconds', () => {
      expect(GC_TIME_DEFAULT).toBe(1000 * 60 * 30);
    });
  });

  describe('getStaleTime', () => {
    it('returns Infinity for historical seasons', () => {
      expect(getStaleTime(2023, 2024, STALE_TIME_RANKINGS)).toBe(Infinity);
    });

    it('returns defaultStaleTime for current season', () => {
      expect(getStaleTime(2024, 2024, STALE_TIME_RANKINGS)).toBe(STALE_TIME_RANKINGS);
    });

    it('returns defaultStaleTime when season is null', () => {
      expect(getStaleTime(null, 2024, STALE_TIME_RANKINGS)).toBe(STALE_TIME_RANKINGS);
    });

    it('returns defaultStaleTime when maxSeason is null', () => {
      expect(getStaleTime(2023, null, STALE_TIME_RANKINGS)).toBe(STALE_TIME_RANKINGS);
    });

    it('returns defaultStaleTime when both are null', () => {
      expect(getStaleTime(null, null, STALE_TIME_RANKINGS)).toBe(STALE_TIME_RANKINGS);
    });

    it('returns Infinity when season is strictly less than maxSeason', () => {
      expect(getStaleTime(2020, 2024, 5000)).toBe(Infinity);
    });

    it('returns defaultStaleTime when season equals maxSeason', () => {
      expect(getStaleTime(2024, 2024, 5000)).toBe(5000);
    });
  });
});
