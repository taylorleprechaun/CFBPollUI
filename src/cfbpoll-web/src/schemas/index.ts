import { z } from 'zod';

// Conference schemas
export const ConferenceSchema = z.object({
  id: z.number(),
  label: z.string(),
  name: z.string(),
});

export const ConferencesResponseSchema = z.object({
  conferences: z.array(ConferenceSchema),
});

// Season schemas
export const SeasonsResponseSchema = z.object({
  seasons: z.array(z.number()),
});

// Week schemas
export const WeekSchema = z.object({
  weekNumber: z.number(),
  label: z.string(),
});

export const WeeksResponseSchema = z.object({
  season: z.number(),
  weeks: z.array(WeekSchema),
});

// Record schema
export const RecordSchema = z.object({
  wins: z.number(),
  losses: z.number(),
});

// Team details schema
export const TeamDetailsSchema = z.object({
  home: RecordSchema,
  away: RecordSchema,
  neutral: RecordSchema,
  vsRank1To10: RecordSchema,
  vsRank11To25: RecordSchema,
  vsRank26To50: RecordSchema,
  vsRank51To100: RecordSchema,
  vsRank101Plus: RecordSchema,
});

// Rankings schemas
export const RankedTeamSchema = z.object({
  rank: z.number(),
  teamName: z.string(),
  logoURL: z.string(),
  conference: z.string(),
  division: z.string(),
  wins: z.number(),
  losses: z.number(),
  record: z.string(),
  rating: z.number(),
  weightedSOS: z.number(),
  sosRanking: z.number(),
  details: TeamDetailsSchema.nullable().optional(),
});

export const RankingsResponseSchema = z.object({
  season: z.number(),
  week: z.number(),
  rankings: z.array(RankedTeamSchema),
});

// Schedule game schema
export const ScheduleGameSchema = z.object({
  gameDate: z.string().nullable().optional(),
  isHome: z.boolean(),
  isWin: z.boolean().nullable().optional(),
  neutralSite: z.boolean(),
  opponentLogoURL: z.string(),
  opponentName: z.string(),
  opponentRecord: z.string(),
  opponentScore: z.number().nullable().optional(),
  seasonType: z.string().nullable().optional(),
  startTimeTbd: z.boolean(),
  teamScore: z.number().nullable().optional(),
  venue: z.string().nullable().optional(),
  week: z.number().nullable().optional(),
});

// Team detail response schema
export const TeamDetailResponseSchema = z.object({
  altColor: z.string(),
  color: z.string(),
  conference: z.string(),
  details: TeamDetailsSchema,
  division: z.string(),
  logoURL: z.string(),
  rank: z.number(),
  rating: z.number(),
  record: z.string(),
  schedule: z.array(ScheduleGameSchema),
  sosRanking: z.number(),
  teamName: z.string(),
  weightedSOS: z.number(),
});

// Type exports inferred from schemas
export type Conference = z.infer<typeof ConferenceSchema>;
export type ConferencesResponse = z.infer<typeof ConferencesResponseSchema>;
export type RankedTeam = z.infer<typeof RankedTeamSchema>;
export type RankingsResponse = z.infer<typeof RankingsResponseSchema>;
export type Record = z.infer<typeof RecordSchema>;
export type ScheduleGame = z.infer<typeof ScheduleGameSchema>;
export type SeasonsResponse = z.infer<typeof SeasonsResponseSchema>;
export type TeamDetailResponse = z.infer<typeof TeamDetailResponseSchema>;
export type TeamDetails = z.infer<typeof TeamDetailsSchema>;
export type Week = z.infer<typeof WeekSchema>;
export type WeeksResponse = z.infer<typeof WeeksResponseSchema>;
