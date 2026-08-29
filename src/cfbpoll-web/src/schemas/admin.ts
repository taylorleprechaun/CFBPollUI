import { z } from 'zod';

import { GamePredictionPublicSchema, RankingsResponseSchema, TrackRecordTotalsSchema } from './index';

export const LoginResponseSchema = z.object({
  expiresIn: z.number(),
  token: z.string(),
});

export const CalculateResponseSchema = z.object({
  isPersisted: z.boolean(),
  rankings: RankingsResponseSchema,
});

export const AdminRankingsResponseSchema = z.object({
  isPublished: z.boolean(),
  rankings: RankingsResponseSchema,
});

export const ExperimentalCalculateResponseSchema = z.object({
  algorithmVersion: z.string(),
  rankings: RankingsResponseSchema,
});

export const PredictionRecordSummarySchema = z.object({
  gradedGameCount: z.number(),
  marginBias: z.number().nullable(),
  marginMAE: z.number().nullable(),
  marginRMSE: z.number().nullable(),
  overUnder: TrackRecordTotalsSchema,
  spread: TrackRecordTotalsSchema,
  winner: TrackRecordTotalsSchema,
});

export const ExperimentalPredictionsResponseSchema = z.object({
  algorithmVersion: z.string(),
  predictions: z.array(GamePredictionPublicSchema),
  summary: PredictionRecordSummarySchema,
});

export const SeasonExperimentalPredictionsWeekSchema = z.object({
  summary: PredictionRecordSummarySchema,
  week: z.number(),
});

export const SeasonExperimentalPredictionsResponseSchema = z.object({
  algorithmVersion: z.string(),
  overallSummary: PredictionRecordSummarySchema,
  season: z.number(),
  weeks: z.array(SeasonExperimentalPredictionsWeekSchema),
});

export const RankingsSnapshotSchema = z.object({
  createdAt: z.string(),
  isPublished: z.boolean(),
  season: z.number(),
  week: z.number(),
});

export const RankingsSnapshotsResponseSchema = z.array(RankingsSnapshotSchema);

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

export const CfbdTopEndpointSchema = z.object({
  endpoint: z.string(),
  requestCount: z.number(),
});

export const CfbdUsageSchema = z.object({
  monthlyLimit: z.number(),
  remainingCalls: z.number(),
  resetAt: z.string(),
  tierName: z.string(),
  topEndpoints: z.array(CfbdTopEndpointSchema),
  totalRequestsInWindow: z.number(),
  usedCalls: z.number(),
});

export const RefreshCacheResponseSchema = z.object({
  removedCount: z.number(),
  season: z.number(),
  week: z.number(),
});

export const CacheEntrySchema = z.object({
  cachedAt: z.string(),
  cacheKey: z.string(),
  detail: z.string(),
  expiresAt: z.string(),
  family: z.string(),
  season: z.number().nullable(),
  sizeBytes: z.number(),
});

export const CacheEntriesResponseSchema = z.array(CacheEntrySchema);

export const RemoveCacheEntriesResponseSchema = z.object({
  removedCount: z.number(),
});

export type AdminPredictionsResponse = z.infer<typeof AdminPredictionsResponseSchema>;
export type AdminRankingsResponse = z.infer<typeof AdminRankingsResponseSchema>;
export type CacheEntry = z.infer<typeof CacheEntrySchema>;
export type CalculatePredictionsResponse = z.infer<typeof CalculatePredictionsResponseSchema>;
export type CalculateResponse = z.infer<typeof CalculateResponseSchema>;
export type CfbdTopEndpoint = z.infer<typeof CfbdTopEndpointSchema>;
export type CfbdUsage = z.infer<typeof CfbdUsageSchema>;
export type ExperimentalCalculateResponse = z.infer<typeof ExperimentalCalculateResponseSchema>;
export type ExperimentalPredictionsResponse = z.infer<typeof ExperimentalPredictionsResponseSchema>;
export type GamePrediction = z.infer<typeof GamePredictionSchema>;
export type GradePredictionsResponse = z.infer<typeof GradePredictionsResponseSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type PredictionRecordSummary = z.infer<typeof PredictionRecordSummarySchema>;
export type PredictionsResponse = z.infer<typeof PredictionsResponseSchema>;
export type PredictionsSummary = z.infer<typeof PredictionsSummarySchema>;
export type RankingsSnapshot = z.infer<typeof RankingsSnapshotSchema>;
export type RefreshCacheResponse = z.infer<typeof RefreshCacheResponseSchema>;
export type RemoveCacheEntriesResponse = z.infer<typeof RemoveCacheEntriesResponseSchema>;
export type SeasonExperimentalPredictionsResponse = z.infer<typeof SeasonExperimentalPredictionsResponseSchema>;
export type SeasonExperimentalPredictionsWeek = z.infer<typeof SeasonExperimentalPredictionsWeekSchema>;
