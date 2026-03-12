import { z } from 'zod';
import { RankingsResponseSchema } from './index';

export const LoginResponseSchema = z.object({
  expiresIn: z.number(),
  token: z.string(),
});

export const CalculateResponseSchema = z.object({
  isPersisted: z.boolean(),
  rankings: RankingsResponseSchema,
});

export const SnapshotSchema = z.object({
  createdAt: z.string(),
  isPublished: z.boolean(),
  season: z.number(),
  week: z.number(),
});

export const SnapshotsResponseSchema = z.array(SnapshotSchema);

export const GamePredictionSchema = z.object({
  awayLogoURL: z.string(),
  awayTeam: z.string(),
  awayTeamScore: z.number(),
  bettingOverUnder: z.number().nullable(),
  bettingSpread: z.number().nullable(),
  homeLogoURL: z.string(),
  homeTeam: z.string(),
  homeTeamScore: z.number(),
  myOverUnderPick: z.string(),
  mySpreadPick: z.string(),
  neutralSite: z.boolean(),
  predictedMargin: z.number(),
  predictedWinner: z.string(),
});

export const PredictionsResponseSchema = z.object({
  predictions: z.array(GamePredictionSchema),
  season: z.number(),
  week: z.number(),
});

export const CalculatePredictionsResponseSchema = z.object({
  isPersisted: z.boolean(),
  predictions: PredictionsResponseSchema,
});

export const PredictionsSummarySchema = z.object({
  createdAt: z.string(),
  gameCount: z.number(),
  isPublished: z.boolean(),
  season: z.number(),
  week: z.number(),
});

export const PredictionsSummariesResponseSchema = z.array(PredictionsSummarySchema);

export type CalculatePredictionsResponse = z.infer<typeof CalculatePredictionsResponseSchema>;
export type CalculateResponse = z.infer<typeof CalculateResponseSchema>;
export type GamePrediction = z.infer<typeof GamePredictionSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type PredictionsResponse = z.infer<typeof PredictionsResponseSchema>;
export type PredictionsSummary = z.infer<typeof PredictionsSummarySchema>;
export type Snapshot = z.infer<typeof SnapshotSchema>;
