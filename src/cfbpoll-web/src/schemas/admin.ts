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

export const SnapshotSchema = z.object({
  createdAt: z.string(),
  isPublished: z.boolean(),
  season: z.number(),
  week: z.number(),
});

export const SnapshotsResponseSchema = z.array(SnapshotSchema);

export type CalculateResponse = z.infer<typeof CalculateResponseSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type Snapshot = z.infer<typeof SnapshotSchema>;
