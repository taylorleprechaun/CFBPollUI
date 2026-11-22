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
  appliedCalibration: z.record(z.string(), z.number()).nullable(),
  predictions: z.array(GamePredictionPublicSchema),
  summary: PredictionRecordSummarySchema,
});

export const SeasonExperimentalPredictionsWeekSchema = z.object({
  appliedCalibration: z.record(z.string(), z.number()).nullable(),
  summary: PredictionRecordSummarySchema,
  week: z.number(),
});

export const SeasonExperimentalPredictionsResponseSchema = z.object({
  algorithmVersion: z.string(),
  overallSummary: PredictionRecordSummarySchema,
  season: z.number(),
  weeks: z.array(SeasonExperimentalPredictionsWeekSchema),
});

export const MatchupActualGameSchema = z.object({
  awayPoints: z.number(),
  awayTeam: z.string(),
  bettingOverUnder: z.number().nullable(),
  bettingSpread: z.number().nullable(),
  homePoints: z.number(),
  homeTeam: z.string(),
  neutralSite: z.boolean(),
  playedAfterPrediction: z.boolean(),
  seasonType: z.string(),
  week: z.number().nullable(),
});

export const ExperimentalMatchupResponseSchema = z.object({
  actualGames: z.array(MatchupActualGameSchema),
  algorithmVersion: z.string(),
  appliedCalibration: z.record(z.string(), z.number()).nullable(),
  prediction: GamePredictionPublicSchema.nullable(),
});

export const FbsTeamNamesResponseSchema = z.object({
  teams: z.array(z.string()),
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
  isPostseason: z.boolean(),
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

export const PredictionCalibrationSourceSchema = z.enum(['Accepted', 'CarriedForward', 'Kept', 'Manual']);

export const PredictionCalibrationParameterSchema = z.object({
  carriesAcrossSeasons: z.boolean(),
  defaultValue: z.number(),
  description: z.string(),
  key: z.string(),
  label: z.string(),
  max: z.number(),
  min: z.number(),
  step: z.number(),
});

export const PredictionCalibrationResponseSchema = z.object({
  carriedFromSeason: z.number().nullable(),
  carriedFromWeek: z.number().nullable(),
  draftUsesDifferentValues: z.boolean(),
  isLocked: z.boolean(),
  isStored: z.boolean(),
  isSupported: z.boolean(),
  parameters: z.array(PredictionCalibrationParameterSchema),
  season: z.number(),
  source: PredictionCalibrationSourceSchema.nullable(),
  updatedAt: z.string().nullable(),
  values: z.record(z.string(), z.number()),
  week: z.number(),
});

export const PredictionCalibrationHistoryEntrySchema = z.object({
  carriedFromSeason: z.number().nullable(),
  carriedFromWeek: z.number().nullable(),
  isLocked: z.boolean(),
  season: z.number(),
  source: PredictionCalibrationSourceSchema,
  updatedAt: z.string().nullable(),
  values: z.record(z.string(), z.number()),
  week: z.number(),
});

export const PredictionCalibrationHistoryResponseSchema = z.array(PredictionCalibrationHistoryEntrySchema);

export const PredictionPickChangeSchema = z.object({
  changed: z.number(),
  comparedCorrect: z.number(),
  usedCorrect: z.number(),
});

export const PredictionPickChangesSchema = z.object({
  overUnder: PredictionPickChangeSchema,
  spread: PredictionPickChangeSchema,
  winner: PredictionPickChangeSchema,
});

export const PredictionCalibrationBacktestWeekSchema = z.object({
  baseline: PredictionRecordSummarySchema,
  baselineChanges: PredictionPickChangesSchema,
  candidate: PredictionRecordSummarySchema.nullable(),
  candidateChanges: PredictionPickChangesSchema.nullable(),
  season: z.number(),
  suggested: PredictionRecordSummarySchema,
  suggestedChanges: PredictionPickChangesSchema,
  suggestedValues: z.record(z.string(), z.number()),
  used: PredictionRecordSummarySchema,
  usedValues: z.record(z.string(), z.number()),
  week: z.number(),
});

export const PredictionCalibrationAnalysisSchema = z.object({
  backtestWeeks: z.array(PredictionCalibrationBacktestWeekSchema),
  candidateValues: z.record(z.string(), z.number()).nullable(),
  suggestedValues: z.record(z.string(), z.number()),
  suggestionNotes: z.record(z.string(), z.string()),
});

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
  failedCount: z.number(),
  refreshedCount: z.number(),
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

export const NewPredictionGameWaitingSchema = z.object({
  awayTeam: z.string(),
  homeTeam: z.string(),
  startDate: z.string().nullable(),
});

export const NewPredictionGamesPreviewSchema = z.object({
  games: z.array(GamePredictionSchema),
  waitingOnLines: z.array(NewPredictionGameWaitingSchema),
});

export type AdminPredictionsResponse = z.infer<typeof AdminPredictionsResponseSchema>;
export type AdminRankingsResponse = z.infer<typeof AdminRankingsResponseSchema>;
export type CacheEntry = z.infer<typeof CacheEntrySchema>;
export type CalculatePredictionsResponse = z.infer<typeof CalculatePredictionsResponseSchema>;
export type CalculateResponse = z.infer<typeof CalculateResponseSchema>;
export type CfbdTopEndpoint = z.infer<typeof CfbdTopEndpointSchema>;
export type CfbdUsage = z.infer<typeof CfbdUsageSchema>;
export type ExperimentalCalculateResponse = z.infer<typeof ExperimentalCalculateResponseSchema>;
export type ExperimentalMatchupResponse = z.infer<typeof ExperimentalMatchupResponseSchema>;
export type ExperimentalPredictionsResponse = z.infer<typeof ExperimentalPredictionsResponseSchema>;
export type FbsTeamNamesResponse = z.infer<typeof FbsTeamNamesResponseSchema>;
export type GamePrediction = z.infer<typeof GamePredictionSchema>;
export type GradePredictionsResponse = z.infer<typeof GradePredictionsResponseSchema>;
export type IncompleteGame = z.infer<typeof IncompleteGameSchema>;
export type IncompleteGamesResponse = z.infer<typeof IncompleteGamesResponseSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type MatchupActualGame = z.infer<typeof MatchupActualGameSchema>;
export type NewPredictionGamesPreview = z.infer<typeof NewPredictionGamesPreviewSchema>;
export type NewPredictionGameWaiting = z.infer<typeof NewPredictionGameWaitingSchema>;
export type PredictionCalibrationAnalysis = z.infer<typeof PredictionCalibrationAnalysisSchema>;
export type PredictionCalibrationBacktestWeek = z.infer<typeof PredictionCalibrationBacktestWeekSchema>;
export type PredictionCalibrationHistoryEntry = z.infer<typeof PredictionCalibrationHistoryEntrySchema>;
export type PredictionCalibrationParameter = z.infer<typeof PredictionCalibrationParameterSchema>;
export type PredictionCalibrationResponse = z.infer<typeof PredictionCalibrationResponseSchema>;
export type PredictionCalibrationSource = z.infer<typeof PredictionCalibrationSourceSchema>;
export type PredictionPickChange = z.infer<typeof PredictionPickChangeSchema>;
export type PredictionPickChanges = z.infer<typeof PredictionPickChangesSchema>;
export type PredictionRecordSummary = z.infer<typeof PredictionRecordSummarySchema>;
export type PredictionsResponse = z.infer<typeof PredictionsResponseSchema>;
export type PredictionsSummary = z.infer<typeof PredictionsSummarySchema>;
export type RankingsSnapshot = z.infer<typeof RankingsSnapshotSchema>;
export type RefreshCacheResponse = z.infer<typeof RefreshCacheResponseSchema>;
export type RemoveCacheEntriesResponse = z.infer<typeof RemoveCacheEntriesResponseSchema>;
export type SeasonExperimentalPredictionsResponse = z.infer<typeof SeasonExperimentalPredictionsResponseSchema>;
export type SeasonExperimentalPredictionsWeek = z.infer<typeof SeasonExperimentalPredictionsWeekSchema>;
