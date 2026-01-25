import { describe, it, expect } from 'vitest';
import {
  SeasonsResponseSchema,
  WeeksResponseSchema,
  RankingsResponseSchema,
  WeekSchema,
  RankedTeamSchema,
} from '../schemas';

describe('Zod Schemas', () => {
  describe('SeasonsResponseSchema', () => {
    it('validates valid seasons response', () => {
      const data = { seasons: [2024, 2023, 2022] };
      const result = SeasonsResponseSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects response with missing seasons', () => {
      const data = {};
      const result = SeasonsResponseSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects response with non-number seasons', () => {
      const data = { seasons: ['2024', '2023'] };
      const result = SeasonsResponseSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('WeekSchema', () => {
    it('validates valid week', () => {
      const data = { weekNumber: 5, label: 'Week 5' };
      const result = WeekSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects week without label', () => {
      const data = { weekNumber: 5 };
      const result = WeekSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('WeeksResponseSchema', () => {
    it('validates valid weeks response', () => {
      const data = {
        season: 2024,
        weeks: [
          { weekNumber: 1, label: 'Week 1' },
          { weekNumber: 2, label: 'Week 2' },
        ],
      };
      const result = WeeksResponseSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects response without season', () => {
      const data = {
        weeks: [{ weekNumber: 1, label: 'Week 1' }],
      };
      const result = WeeksResponseSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('RankedTeamSchema', () => {
    it('validates valid ranked team', () => {
      const data = {
        rank: 1,
        teamName: 'Georgia',
        logoURL: 'https://example.com/logo.png',
        conference: 'SEC',
        division: 'East',
        wins: 10,
        losses: 2,
        record: '10-2',
        rating: 85.5,
        weightedSOS: 0.65,
        sosRanking: 5,
      };
      const result = RankedTeamSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects team with missing required fields', () => {
      const data = {
        rank: 1,
        teamName: 'Georgia',
      };
      const result = RankedTeamSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('RankingsResponseSchema', () => {
    it('validates valid rankings response', () => {
      const data = {
        season: 2024,
        week: 5,
        rankings: [
          {
            rank: 1,
            teamName: 'Georgia',
            logoURL: 'https://example.com/logo.png',
            conference: 'SEC',
            division: 'East',
            wins: 5,
            losses: 0,
            record: '5-0',
            rating: 85.5,
            weightedSOS: 0.65,
            sosRanking: 5,
          },
        ],
      };
      const result = RankingsResponseSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('validates empty rankings array', () => {
      const data = {
        season: 2024,
        week: 5,
        rankings: [],
      };
      const result = RankingsResponseSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects response with invalid team data', () => {
      const data = {
        season: 2024,
        week: 5,
        rankings: [{ invalidField: true }],
      };
      const result = RankingsResponseSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});
