import { describe, it, expect } from 'vitest';
import {
  AdminPredictionsResponseSchema,
  CalculatePredictionsResponseSchema,
  CalculateResponseSchema,
  GamePredictionSchema,
  GradePredictionsResponseSchema,
  LoginResponseSchema,
  PredictionsResponseSchema,
  PredictionsSummarySchema,
  PredictionsSummariesResponseSchema,
  RefreshCacheResponseSchema,
  SnapshotSchema,
  SnapshotsResponseSchema,
} from '../../schemas/admin';

describe('Admin schemas', () => {
  describe('LoginResponseSchema', () => {
    it('validates a valid login response', () => {
      const data = { token: 'jwt-token-here', expiresIn: 28800 };
      const result = LoginResponseSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.token).toBe('jwt-token-here');
        expect(result.data.expiresIn).toBe(28800);
      }
    });

    it('rejects missing token', () => {
      const data = { expiresIn: 28800 };
      const result = LoginResponseSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects missing expiresIn', () => {
      const data = { token: 'jwt-token-here' };
      const result = LoginResponseSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('CalculateResponseSchema', () => {
    it('validates a valid calculate response', () => {
      const data = {
        isPersisted: true,
        rankings: {
          season: 2024,
          week: 5,
          rankings: [],
        },
      };
      const result = CalculateResponseSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects missing isPersisted field', () => {
      const data = {
        rankings: { season: 2024, week: 5, rankings: [] },
      };
      const result = CalculateResponseSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('SnapshotSchema', () => {
    it('validates a valid snapshot', () => {
      const data = {
        season: 2024,
        week: 5,
        isPublished: true,
        createdAt: '2024-11-01T12:00:00Z',
      };
      const result = SnapshotSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects missing isPublished field', () => {
      const data = {
        season: 2024,
        week: 5,
        createdAt: '2024-11-01T12:00:00Z',
      };
      const result = SnapshotSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('GamePredictionSchema', () => {
    it('validates a valid game prediction', () => {
      const data = {
        actualAwayScore: null,
        actualHomeScore: null,
        actualOverUnderResult: null,
        actualSpreadCoveringTeam: null,
        actualWinner: null,
        awayLogoURL: 'https://example.com/michigan.png',
        awayTeam: 'Michigan',
        awayTeamScore: 17,
        bettingOverUnder: 48.5,
        bettingSpread: -7.5,
        homeLogoURL: 'https://example.com/ohiostate.png',
        homeTeam: 'Ohio State',
        homeTeamScore: 28,
        myOverUnderPick: 'Under',
        mySpreadPick: 'Ohio State',
        neutralSite: false,
        overUnderGrade: 'Ungraded',
        predictedMargin: 10.5,
        predictedWinner: 'Ohio State',
        spreadGrade: 'Ungraded',
        winnerGrade: 'Ungraded',
      };
      const result = GamePredictionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('validates a graded game prediction', () => {
      const data = {
        actualAwayScore: 17,
        actualHomeScore: 28,
        actualOverUnderResult: 'Under',
        actualSpreadCoveringTeam: 'Ohio State',
        actualWinner: 'Ohio State',
        awayLogoURL: 'https://example.com/michigan.png',
        awayTeam: 'Michigan',
        awayTeamScore: 17,
        bettingOverUnder: 48.5,
        bettingSpread: -7.5,
        homeLogoURL: 'https://example.com/ohiostate.png',
        homeTeam: 'Ohio State',
        homeTeamScore: 28,
        myOverUnderPick: 'Under',
        mySpreadPick: 'Ohio State',
        neutralSite: false,
        overUnderGrade: 'Correct',
        predictedMargin: 10.5,
        predictedWinner: 'Ohio State',
        spreadGrade: 'Correct',
        winnerGrade: 'Correct',
      };
      const result = GamePredictionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('validates null betting values', () => {
      const data = {
        actualAwayScore: null,
        actualHomeScore: null,
        actualOverUnderResult: null,
        actualSpreadCoveringTeam: null,
        actualWinner: null,
        awayLogoURL: '',
        awayTeam: 'Texas',
        awayTeamScore: 24,
        bettingOverUnder: null,
        bettingSpread: null,
        homeLogoURL: '',
        homeTeam: 'Oklahoma',
        homeTeamScore: 21,
        myOverUnderPick: '',
        mySpreadPick: '',
        neutralSite: true,
        overUnderGrade: 'NotApplicable',
        predictedMargin: 3.0,
        predictedWinner: 'Texas',
        spreadGrade: 'NotApplicable',
        winnerGrade: 'Ungraded',
      };
      const result = GamePredictionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects missing predictedWinner', () => {
      const data = {
        actualAwayScore: null,
        actualHomeScore: null,
        actualOverUnderResult: null,
        actualSpreadCoveringTeam: null,
        actualWinner: null,
        awayLogoURL: '',
        awayTeam: 'Michigan',
        awayTeamScore: 17,
        bettingOverUnder: 48.5,
        bettingSpread: -7.5,
        homeLogoURL: '',
        homeTeam: 'Ohio State',
        homeTeamScore: 28,
        myOverUnderPick: 'Under',
        mySpreadPick: 'Ohio State',
        neutralSite: false,
        overUnderGrade: 'Ungraded',
        predictedMargin: 10.5,
        spreadGrade: 'Ungraded',
        winnerGrade: 'Ungraded',
      };
      const result = GamePredictionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects missing winnerGrade', () => {
      const data = {
        actualAwayScore: null,
        actualHomeScore: null,
        actualOverUnderResult: null,
        actualSpreadCoveringTeam: null,
        actualWinner: null,
        awayLogoURL: '',
        awayTeam: 'Michigan',
        awayTeamScore: 17,
        bettingOverUnder: 48.5,
        bettingSpread: -7.5,
        homeLogoURL: '',
        homeTeam: 'Ohio State',
        homeTeamScore: 28,
        myOverUnderPick: 'Under',
        mySpreadPick: 'Ohio State',
        neutralSite: false,
        overUnderGrade: 'Ungraded',
        predictedMargin: 10.5,
        predictedWinner: 'Ohio State',
        spreadGrade: 'Ungraded',
      };
      const result = GamePredictionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('PredictionsResponseSchema', () => {
    it('validates a valid predictions response', () => {
      const data = {
        isGraded: false,
        resultsPublished: false,
        season: 2024,
        week: 5,
        predictions: [
          {
            actualAwayScore: null,
            actualHomeScore: null,
            actualOverUnderResult: null,
            actualSpreadCoveringTeam: null,
            actualWinner: null,
            awayLogoURL: 'https://example.com/iowa.png',
            awayTeam: 'Iowa',
            awayTeamScore: 21,
            bettingOverUnder: 42.0,
            bettingSpread: -7.0,
            homeLogoURL: 'https://example.com/nebraska.png',
            homeTeam: 'Nebraska',
            homeTeamScore: 28,
            myOverUnderPick: 'Over',
            mySpreadPick: 'Nebraska',
            neutralSite: false,
            overUnderGrade: 'Ungraded',
            predictedMargin: 7.0,
            predictedWinner: 'Nebraska',
            spreadGrade: 'Ungraded',
            winnerGrade: 'Ungraded',
          },
        ],
      };
      const result = PredictionsResponseSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects missing predictions array', () => {
      const data = { resultsPublished: false, season: 2024, week: 5 };
      const result = PredictionsResponseSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects missing resultsPublished', () => {
      const data = { isGraded: false, season: 2024, week: 5, predictions: [] };
      const result = PredictionsResponseSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects missing isGraded', () => {
      const data = { resultsPublished: false, season: 2024, week: 5, predictions: [] };
      const result = PredictionsResponseSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('AdminPredictionsResponseSchema', () => {
    it('validates a valid admin predictions response', () => {
      const data = {
        isPublished: true,
        predictions: { isGraded: true, resultsPublished: false, season: 2024, week: 5, predictions: [] },
      };
      const result = AdminPredictionsResponseSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects missing isPublished', () => {
      const data = {
        predictions: { isGraded: true, resultsPublished: false, season: 2024, week: 5, predictions: [] },
      };
      const result = AdminPredictionsResponseSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('GradePredictionsResponseSchema', () => {
    it('validates a valid grade predictions response', () => {
      const data = {
        isPersisted: true,
        predictions: { isGraded: true, resultsPublished: true, season: 2024, week: 5, predictions: [] },
        unmatchedGameCount: 0,
      };
      const result = GradePredictionsResponseSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects missing unmatchedGameCount', () => {
      const data = {
        isPersisted: true,
        predictions: { isGraded: true, resultsPublished: true, season: 2024, week: 5, predictions: [] },
      };
      const result = GradePredictionsResponseSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('CalculatePredictionsResponseSchema', () => {
    it('validates a valid calculate predictions response', () => {
      const data = {
        isPersisted: true,
        predictions: {
          isGraded: false,
          resultsPublished: false,
          season: 2024,
          week: 5,
          predictions: [],
        },
      };
      const result = CalculatePredictionsResponseSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects missing isPersisted field', () => {
      const data = {
        predictions: { isGraded: false, resultsPublished: false, season: 2024, week: 5, predictions: [] },
      };
      const result = CalculatePredictionsResponseSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('PredictionsSummarySchema', () => {
    it('validates a valid predictions summary', () => {
      const data = {
        createdAt: '2024-11-01T12:00:00Z',
        gameCount: 15,
        gradedAt: null,
        isGraded: false,
        isPublished: true,
        resultsPublished: false,
        season: 2024,
        week: 5,
      };
      const result = PredictionsSummarySchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('validates a graded predictions summary', () => {
      const data = {
        createdAt: '2024-11-01T12:00:00Z',
        gameCount: 15,
        gradedAt: '2024-11-05T12:00:00Z',
        isGraded: true,
        isPublished: true,
        resultsPublished: true,
        season: 2024,
        week: 5,
      };
      const result = PredictionsSummarySchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects missing gameCount', () => {
      const data = {
        createdAt: '2024-11-01T12:00:00Z',
        gradedAt: null,
        isGraded: false,
        isPublished: true,
        resultsPublished: false,
        season: 2024,
        week: 5,
      };
      const result = PredictionsSummarySchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects missing isGraded', () => {
      const data = {
        createdAt: '2024-11-01T12:00:00Z',
        gameCount: 15,
        gradedAt: null,
        isPublished: true,
        resultsPublished: false,
        season: 2024,
        week: 5,
      };
      const result = PredictionsSummarySchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('PredictionsSummariesResponseSchema', () => {
    it('validates an array of prediction summaries', () => {
      const data = [
        { createdAt: '2024-09-01T12:00:00Z', gameCount: 10, gradedAt: null, isGraded: false, isPublished: true, resultsPublished: false, season: 2024, week: 1 },
        { createdAt: '2024-09-08T12:00:00Z', gameCount: 8, gradedAt: null, isGraded: false, isPublished: false, resultsPublished: false, season: 2024, week: 2 },
      ];
      const result = PredictionsSummariesResponseSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
    });

    it('validates an empty array', () => {
      const result = PredictionsSummariesResponseSchema.safeParse([]);
      expect(result.success).toBe(true);
    });
  });

  describe('RefreshCacheResponseSchema', () => {
    it('validates a valid refresh cache response', () => {
      const data = { removedCount: 8, season: 2024, week: 5 };
      const result = RefreshCacheResponseSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('validates a zero removedCount', () => {
      const data = { removedCount: 0, season: 2024, week: 5 };
      const result = RefreshCacheResponseSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects missing removedCount field', () => {
      const data = { season: 2024, week: 5 };
      const result = RefreshCacheResponseSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('SnapshotsResponseSchema', () => {
    it('validates an array of snapshots', () => {
      const data = [
        { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T12:00:00Z' },
        { season: 2024, week: 2, isPublished: false, createdAt: '2024-09-08T12:00:00Z' },
      ];
      const result = SnapshotsResponseSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
    });

    it('validates an empty array', () => {
      const result = SnapshotsResponseSchema.safeParse([]);
      expect(result.success).toBe(true);
    });

    it('rejects non-array input', () => {
      const result = SnapshotsResponseSchema.safeParse({ weeks: [] });
      expect(result.success).toBe(false);
    });
  });
});
