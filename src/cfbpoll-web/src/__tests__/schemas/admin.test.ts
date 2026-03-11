import { describe, it, expect } from 'vitest';
import {
  CalculatePredictionsResponseSchema,
  CalculateResponseSchema,
  GamePredictionSchema,
  LoginResponseSchema,
  PredictionsResponseSchema,
  PredictionsSummarySchema,
  PredictionsSummariesResponseSchema,
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
        awayTeam: 'Michigan',
        confidence: 75.5,
        homeTeam: 'Ohio State',
        homeWinProbability: 0.72,
        neutralSite: false,
        predictedMargin: 10.5,
        predictedWinner: 'Ohio State',
      };
      const result = GamePredictionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects missing predictedWinner', () => {
      const data = {
        awayTeam: 'Michigan',
        confidence: 75.5,
        homeTeam: 'Ohio State',
        homeWinProbability: 0.72,
        neutralSite: false,
        predictedMargin: 10.5,
      };
      const result = GamePredictionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('PredictionsResponseSchema', () => {
    it('validates a valid predictions response', () => {
      const data = {
        season: 2024,
        week: 5,
        predictions: [
          {
            awayTeam: 'Iowa',
            confidence: 65,
            homeTeam: 'Nebraska',
            homeWinProbability: 0.68,
            neutralSite: false,
            predictedMargin: 7.0,
            predictedWinner: 'Nebraska',
          },
        ],
      };
      const result = PredictionsResponseSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects missing predictions array', () => {
      const data = { season: 2024, week: 5 };
      const result = PredictionsResponseSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('CalculatePredictionsResponseSchema', () => {
    it('validates a valid calculate predictions response', () => {
      const data = {
        isPersisted: true,
        predictions: {
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
        predictions: { season: 2024, week: 5, predictions: [] },
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
        isPublished: true,
        season: 2024,
        week: 5,
      };
      const result = PredictionsSummarySchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects missing gameCount', () => {
      const data = {
        createdAt: '2024-11-01T12:00:00Z',
        isPublished: true,
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
        { createdAt: '2024-09-01T12:00:00Z', gameCount: 10, isPublished: true, season: 2024, week: 1 },
        { createdAt: '2024-09-08T12:00:00Z', gameCount: 8, isPublished: false, season: 2024, week: 2 },
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
