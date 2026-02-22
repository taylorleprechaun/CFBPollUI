import { describe, it, expect } from 'vitest';
import {
  SeasonsResponseSchema,
  WeeksResponseSchema,
  RankingsResponseSchema,
  WeekSchema,
  RankedTeamSchema,
  ScheduleGameSchema,
  TeamDetailResponseSchema,
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
        teamName: 'Florida',
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
        teamName: 'Florida',
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
            teamName: 'Florida',
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

  describe('ScheduleGameSchema', () => {
    it('validates valid schedule game', () => {
      const data = {
        gameDate: '2024-09-07T00:00:00',
        isHome: true,
        isWin: true,
        neutralSite: false,
        opponentLogoURL: 'https://example.com/logo.png',
        opponentName: 'USC',
        opponentRecord: '8-2',
        opponentScore: 21,
        seasonType: 'regular',
        startTimeTbd: false,
        teamScore: 35,
        venue: 'Sanford Stadium',
        week: 1,
      };
      const result = ScheduleGameSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('validates schedule game with null optional fields', () => {
      const data = {
        gameDate: null,
        isHome: false,
        isWin: null,
        neutralSite: true,
        opponentLogoURL: '',
        opponentName: 'TBD',
        opponentRecord: '',
        opponentScore: null,
        seasonType: null,
        startTimeTbd: true,
        teamScore: null,
        venue: null,
        week: null,
      };
      const result = ScheduleGameSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects schedule game with missing required fields', () => {
      const data = { isHome: true };
      const result = ScheduleGameSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('TeamDetailResponseSchema', () => {
    it('validates valid team detail response', () => {
      const data = {
        altColor: '#FFD700',
        color: '#006400',
        conference: 'Big Ten',
        details: {
          home: { wins: 6, losses: 0 },
          away: { wins: 4, losses: 0 },
          neutral: { wins: 1, losses: 0 },
          vsRank1To10: { wins: 2, losses: 0 },
          vsRank11To25: { wins: 3, losses: 0 },
          vsRank26To50: { wins: 1, losses: 0 },
          vsRank51To100: { wins: 2, losses: 0 },
          vsRank101Plus: { wins: 3, losses: 0 },
        },
        division: '',
        logoURL: 'https://example.com/usc.png',
        rank: 1,
        rating: 165.42,
        record: '11-0',
        schedule: [],
        sosRanking: 15,
        teamName: 'USC',
        weightedSOS: 0.582,
      };
      const result = TeamDetailResponseSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects response with missing required fields', () => {
      const data = { teamName: 'USC' };
      const result = TeamDetailResponseSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});
