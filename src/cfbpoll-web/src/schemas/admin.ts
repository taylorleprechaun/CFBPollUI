import { z } from 'zod';

import { GamePredictionPublicSchema, RankingsResponseSchema } from './index';

export const LoginResponseSchema = z.object({
  expiresIn: z.number(),
  token: z.string(),
});

export const CalculateResponseSchema = z.object({
  isPersisted: z.boolean(),
  rankings: RankingsResponseSchema,
});

export const ExperimentalCalculateResponseSchema = z.object({
  algorithmVersion: z.string(),
  rankings: RankingsResponseSchema,
});

export const SnapshotSchema = z.object({
  createdAt: z.string(),
  isPublished: z.boolean(),
  season: z.number(),
  week: z.number(),
});

export const SnapshotsResponseSchema = z.array(SnapshotSchema);

// Admin-side predictions have the same shape as the public predictions response;
// reuse the public schema instead of redeclaring the 21 fields here.
export const GamePredictionSchema = GamePredictionPublicSchema;

export const PredictionsResponseSchema = z.object({
  isGraded: z.boolean(),
  predictions: z.array(GamePredictionSchema),
  resultsPublished: z.boolean(),
  season: z.number(),
  week: z.number(),
});

export const AdminPredictionsResponseSchema = z.object({
  isPublished: z.boolean(),
  predictions: PredictionsResponseSchema,
});

export const CalculatePredictionsResponseSchema = z.object({
  isPersisted: z.boolean(),
  predictions: PredictionsResponseSchema,
});

export const GradePredictionsResponseSchema = z.object({
  isPersisted: z.boolean(),
  predictions: PredictionsResponseSchema,
  unmatchedGameCount: z.number(),
});

export const PredictionsSummarySchema = z.object({
  createdAt: z.string(),
  gameCount: z.number(),
  gradedAt: z.string().nullable(),
  isGraded: z.boolean(),
  isPublished: z.boolean(),
  resultsPublished: z.boolean(),
  season: z.number(),
  week: z.number(),
});

export const PredictionsSummariesResponseSchema = z.array(PredictionsSummarySchema);

export const RefreshCacheResponseSchema = z.object({
  removedCount: z.number(),
  season: z.number(),
  week: z.number(),
});

export type AdminPredictionsResponse = z.infer<typeof AdminPredictionsResponseSchema>;
export type CalculatePredictionsResponse = z.infer<typeof CalculatePredictionsResponseSchema>;
export type CalculateResponse = z.infer<typeof CalculateResponseSchema>;
export type ExperimentalCalculateResponse = z.infer<typeof ExperimentalCalculateResponseSchema>;
export type GamePrediction = z.infer<typeof GamePredictionSchema>;
export type GradePredictionsResponse = z.infer<typeof GradePredictionsResponseSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type PredictionsResponse = z.infer<typeof PredictionsResponseSchema>;
export type PredictionsSummary = z.infer<typeof PredictionsSummarySchema>;
export type RefreshCacheResponse = z.infer<typeof RefreshCacheResponseSchema>;
export type Snapshot = z.infer<typeof SnapshotSchema>;
