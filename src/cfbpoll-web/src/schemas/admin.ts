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

export const IncompleteGameSchema = z.object({
  awayTeam: z.string().nullable(),
  homeTeam: z.string().nullable(),
  startDate: z.string().nullable(),
  startTimeTbd: z.boolean(),
});

export const IncompleteGamesResponseSchema = z.object({
  games: z.array(IncompleteGameSchema),
  season: z.number(),
  week: z.number(),
});

export const CompletedGameSchema = z.object({
  awayPoints: z.number().nullable(),
  awayTeam: z.string().nullable(),
  awayTeamLogoURL: z.string().nullable(),
  gameID: z.number().nullable(),
  hasOverride: z.boolean(),
  homePoints: z.number().nullable(),
  homeTeam: z.string().nullable(),
  homeTeamLogoURL: z.string().nullable(),
  seasonType: z.string().nullable(),
});

export const CompletedGamesResponseSchema = z.object({
  games: z.array(CompletedGameSchema),
  season: z.number(),
  week: z.number(),
});

export const GameOverrideSchema = z.object({
  awayTeam: z.string(),
  awayTeamLogoURL: z.string().nullable(),
  createdAt: z.string(),
  gameID: z.number(),
  homeTeam: z.string(),
  homeTeamLogoURL: z.string().nullable(),
  modifiedAt: z.string(),
  originalAwayPoints: z.number(),
  originalHomePoints: z.number(),
  overrideAwayPoints: z.number(),
  overrideHomePoints: z.number(),
  reason: z.string(),
  season: z.number(),
  seasonType: z.string(),
  week: z.number(),
});

export const GameOverridesResponseSchema = z.array(GameOverrideSchema);

export type AdminPredictionsResponse = z.infer<typeof AdminPredictionsResponseSchema>;
export type AdminRankingsResponse = z.infer<typeof AdminRankingsResponseSchema>;
export type CacheEntry = z.infer<typeof CacheEntrySchema>;
export type CalculatePredictionsResponse = z.infer<typeof CalculatePredictionsResponseSchema>;
export type CalculateResponse = z.infer<typeof CalculateResponseSchema>;
export type CfbdTopEndpoint = z.infer<typeof CfbdTopEndpointSchema>;
export type CfbdUsage = z.infer<typeof CfbdUsageSchema>;
export type CompletedGame = z.infer<typeof CompletedGameSchema>;
export type CompletedGamesResponse = z.infer<typeof CompletedGamesResponseSchema>;
export type ExperimentalCalculateResponse = z.infer<typeof ExperimentalCalculateResponseSchema>;
export type ExperimentalPredictionsResponse = z.infer<typeof ExperimentalPredictionsResponseSchema>;
export type GameOverride = z.infer<typeof GameOverrideSchema>;
export type GamePrediction = z.infer<typeof GamePredictionSchema>;
export type GradePredictionsResponse = z.infer<typeof GradePredictionsResponseSchema>;
export type IncompleteGame = z.infer<typeof IncompleteGameSchema>;
export type IncompleteGamesResponse = z.infer<typeof IncompleteGamesResponseSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type PredictionRecordSummary = z.infer<typeof PredictionRecordSummarySchema>;
export type PredictionsResponse = z.infer<typeof PredictionsResponseSchema>;
export type PredictionsSummary = z.infer<typeof PredictionsSummarySchema>;
export type RankingsSnapshot = z.infer<typeof RankingsSnapshotSchema>;
export type RefreshCacheResponse = z.infer<typeof RefreshCacheResponseSchema>;
export type RemoveCacheEntriesResponse = z.infer<typeof RemoveCacheEntriesResponseSchema>;
export type SeasonExperimentalPredictionsResponse = z.infer<typeof SeasonExperimentalPredictionsResponseSchema>;
export type SeasonExperimentalPredictionsWeek = z.infer<typeof SeasonExperimentalPredictionsWeekSchema>;
