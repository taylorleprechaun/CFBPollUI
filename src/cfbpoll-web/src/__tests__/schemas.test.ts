import { describe, it, expect } from 'vitest';
import {
  SeasonsResponseSchema,
  WeeksResponseSchema,
  RankingsResponseSchema,
  WeekSchema,
  RankedTeamSchema,
  ScheduleGameSchema,
  TeamDetailResponseSchema,
  GamePredictionPublicSchema,
  PredictionsPublicResponseSchema,
  TrackRecordTotalsSchema,
  TrackRecordWeekSchema,
  TrackRecordResponseSchema,
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
      const data = { weekNumber: 5, label: 'Week 5', predictionsPublished: false, rankingsPublished: false };
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
          { weekNumber: 1, label: 'Week 1', predictionsPublished: false, rankingsPublished: true },
          { weekNumber: 2, label: 'Week 2', predictionsPublished: true, rankingsPublished: false },
        ],
      };
      const result = WeeksResponseSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects response without season', () => {
      const data = {
        weeks: [{ weekNumber: 1, label: 'Week 1', predictionsPublished: false, rankingsPublished: false }],
      };
      const result = WeeksResponseSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('RankedTeamSchema', () => {
    it('validates valid ranked team', () => {
      const data = {
        rank: 1,
        rankDelta: 2,
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

    it('validates ranked team with null rankDelta', () => {
      const data = {
        rank: 1,
        rankDelta: null,
        teamName: 'Nebraska',
        logoURL: 'https://example.com/logo.png',
        conference: 'Big Ten',
        division: '',
        wins: 8,
        losses: 3,
        record: '8-3',
        rating: 75.0,
        weightedSOS: 0.55,
        sosRanking: 20,
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
            rankDelta: 3,
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

  describe('GamePredictionPublicSchema', () => {
    it('validates a valid prediction', () => {
      const data = {
        actualAwayScore: null,
        actualHomeScore: null,
        actualOverUnderResult: null,
        actualSpreadCoveringTeam: null,
        actualWinner: null,
        awayLogoURL: 'https://example.com/away.png',
        awayTeam: 'Michigan',
        awayTeamScore: 17,
        bettingOverUnder: 45.5,
        bettingSpread: -3.5,
        homeLogoURL: 'https://example.com/home.png',
        homeTeam: 'Ohio State',
        homeTeamScore: 28,
        myOverUnderPick: 'Over',
        mySpreadPick: 'Ohio State',
        neutralSite: false,
        overUnderGrade: 'Ungraded',
        predictedMargin: 11,
        predictedWinner: 'Ohio State',
        spreadGrade: 'Ungraded',
        winnerGrade: 'Ungraded',
      };
      const result = GamePredictionPublicSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('validates a graded prediction', () => {
      const data = {
        actualAwayScore: 17,
        actualHomeScore: 28,
        actualOverUnderResult: 'Under',
        actualSpreadCoveringTeam: 'Ohio State',
        actualWinner: 'Ohio State',
        awayLogoURL: 'https://example.com/away.png',
        awayTeam: 'Michigan',
        awayTeamScore: 17,
        bettingOverUnder: 45.5,
        bettingSpread: -3.5,
        homeLogoURL: 'https://example.com/home.png',
        homeTeam: 'Ohio State',
        homeTeamScore: 28,
        myOverUnderPick: 'Over',
        mySpreadPick: 'Ohio State',
        neutralSite: false,
        overUnderGrade: 'Correct',
        predictedMargin: 11,
        predictedWinner: 'Ohio State',
        spreadGrade: 'Correct',
        winnerGrade: 'Correct',
      };
      const result = GamePredictionPublicSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('allows null betting lines', () => {
      const data = {
        actualAwayScore: null,
        actualHomeScore: null,
        actualOverUnderResult: null,
        actualSpreadCoveringTeam: null,
        actualWinner: null,
        awayLogoURL: '',
        awayTeam: 'Michigan',
        awayTeamScore: 17,
        bettingOverUnder: null,
        bettingSpread: null,
        homeLogoURL: '',
        homeTeam: 'Ohio State',
        homeTeamScore: 28,
        myOverUnderPick: '',
        mySpreadPick: '',
        neutralSite: false,
        overUnderGrade: 'NotApplicable',
        predictedMargin: 11,
        predictedWinner: 'Ohio State',
        spreadGrade: 'NotApplicable',
        winnerGrade: 'Ungraded',
      };
      const result = GamePredictionPublicSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects a prediction missing required fields', () => {
      const data = { homeTeam: 'Ohio State' };
      const result = GamePredictionPublicSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects a prediction missing winnerGrade', () => {
      const data = {
        actualAwayScore: null,
        actualHomeScore: null,
        actualOverUnderResult: null,
        actualSpreadCoveringTeam: null,
        actualWinner: null,
        awayLogoURL: '',
        awayTeam: 'Michigan',
        awayTeamScore: 17,
        bettingOverUnder: null,
        bettingSpread: null,
        homeLogoURL: '',
        homeTeam: 'Ohio State',
        homeTeamScore: 28,
        myOverUnderPick: '',
        mySpreadPick: '',
        neutralSite: false,
        overUnderGrade: 'Ungraded',
        predictedMargin: 11,
        predictedWinner: 'Ohio State',
        spreadGrade: 'Ungraded',
      };
      const result = GamePredictionPublicSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects an unrecognized spreadGrade value', () => {
      const data = {
        actualAwayScore: null,
        actualHomeScore: null,
        actualOverUnderResult: null,
        actualSpreadCoveringTeam: null,
        actualWinner: null,
        awayLogoURL: '',
        awayTeam: 'Michigan',
        awayTeamScore: 17,
        bettingOverUnder: null,
        bettingSpread: null,
        homeLogoURL: '',
        homeTeam: 'Ohio State',
        homeTeamScore: 28,
        myOverUnderPick: '',
        mySpreadPick: '',
        neutralSite: false,
        overUnderGrade: 'Ungraded',
        predictedMargin: 11,
        predictedWinner: 'Ohio State',
        spreadGrade: 'Pending', // not a valid GameGrade value
        winnerGrade: 'Ungraded',
      };
      const result = GamePredictionPublicSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('PredictionsPublicResponseSchema', () => {
    it('validates a valid response', () => {
      const data = { resultsPublished: false, season: 2024, week: 5, predictions: [] };
      const result = PredictionsPublicResponseSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects a response without season', () => {
      const data = { resultsPublished: false, week: 5, predictions: [] };
      const result = PredictionsPublicResponseSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects a response without resultsPublished', () => {
      const data = { season: 2024, week: 5, predictions: [] };
      const result = PredictionsPublicResponseSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('TrackRecordTotalsSchema', () => {
    it('validates valid totals', () => {
      const data = { correct: 10, incorrect: 4, push: 1 };
      const result = TrackRecordTotalsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects totals missing a field', () => {
      const data = { correct: 10, incorrect: 4 };
      const result = TrackRecordTotalsSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('TrackRecordWeekSchema', () => {
    it('validates a valid week', () => {
      const data = {
        overUnder: { correct: 3, incorrect: 2, push: 0 },
        season: 2024,
        spread: { correct: 4, incorrect: 1, push: 0 },
        week: 3,
        winner: { correct: 5, incorrect: 0, push: 0 },
      };
      const result = TrackRecordWeekSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects a week missing totals for a category', () => {
      const data = {
        overUnder: { correct: 3, incorrect: 2, push: 0 },
        season: 2024,
        week: 3,
        winner: { correct: 5, incorrect: 0, push: 0 },
      };
      const result = TrackRecordWeekSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('TrackRecordResponseSchema', () => {
    it('validates a valid response', () => {
      const data = {
        overallOverUnder: { correct: 10, incorrect: 8, push: 1 },
        overallSpread: { correct: 12, incorrect: 6, push: 0 },
        overallWinner: { correct: 15, incorrect: 3, push: 0 },
        weeks: [],
      };
      const result = TrackRecordResponseSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects a response missing an overall category', () => {
      const data = {
        overallOverUnder: { correct: 10, incorrect: 8, push: 1 },
        overallWinner: { correct: 15, incorrect: 3, push: 0 },
        weeks: [],
      };
      const result = TrackRecordResponseSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});
