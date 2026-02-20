import type { z } from 'zod';
import { ValidationError } from '../lib/api-error';
import { safeFetch } from '../lib/safe-fetch';
import {
  ConferencesResponseSchema,
  RankingsResponseSchema,
  SeasonsResponseSchema,
  TeamDetailResponseSchema,
  WeeksResponseSchema,
  type ConferencesResponse,
  type RankingsResponse,
  type SeasonsResponse,
  type TeamDetailResponse,
  type WeeksResponse,
} from '../schemas';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:5001';

async function fetchWithValidation<T>(
  url: string,
  schema: z.ZodSchema<T>
): Promise<T> {
  const response = await safeFetch(url);

  const data = await response.json();
  const result = schema.safeParse(data);

  if (!result.success) {
    throw new ValidationError(result.error);
  }

  return result.data;
}

export async function fetchSeasons(): Promise<SeasonsResponse> {
  return fetchWithValidation(
    `${API_BASE_URL}/api/v1/seasons`,
    SeasonsResponseSchema
  );
}

export async function fetchWeeks(season: number): Promise<WeeksResponse> {
  return fetchWithValidation(
    `${API_BASE_URL}/api/v1/seasons/${season}/weeks`,
    WeeksResponseSchema
  );
}

export async function fetchRankings(
  season: number,
  week: number
): Promise<RankingsResponse> {
  return fetchWithValidation(
    `${API_BASE_URL}/api/v1/rankings?season=${season}&week=${week}`,
    RankingsResponseSchema
  );
}

export async function fetchConferences(): Promise<ConferencesResponse> {
  return fetchWithValidation(
    `${API_BASE_URL}/api/v1/conferences`,
    ConferencesResponseSchema
  );
}

export async function fetchAvailableWeeks(
  season: number
): Promise<WeeksResponse> {
  return fetchWithValidation(
    `${API_BASE_URL}/api/v1/rankings/available-weeks?season=${season}`,
    WeeksResponseSchema
  );
}

export async function fetchTeamDetail(
  season: number,
  week: number,
  teamName: string
): Promise<TeamDetailResponse> {
  return fetchWithValidation(
    `${API_BASE_URL}/api/v1/teams/${encodeURIComponent(teamName)}?season=${season}&week=${week}`,
    TeamDetailResponseSchema
  );
}
