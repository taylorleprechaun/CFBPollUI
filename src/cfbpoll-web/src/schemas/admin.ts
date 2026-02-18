import { z } from 'zod';
import { RankingsResponseSchema } from './index';

export const LoginResponseSchema = z.object({
  expiresIn: z.number(),
  token: z.string(),
});

export const CalculateResponseSchema = z.object({
  persisted: z.boolean(),
  rankings: RankingsResponseSchema,
});

export const PersistedWeekSchema = z.object({
  createdAt: z.string(),
  published: z.boolean(),
  season: z.number(),
  week: z.number(),
});

export const PersistedWeeksResponseSchema = z.array(PersistedWeekSchema);

export type CalculateResponse = z.infer<typeof CalculateResponseSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type PersistedWeek = z.infer<typeof PersistedWeekSchema>;
