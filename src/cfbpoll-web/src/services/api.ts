import { API_BASE_URL } from '../lib/config';
import { parseResponse } from '../lib/parse-response';
import { safeFetch } from '../lib/safe-fetch';

import {
  AllTimeResponseSchema,
  ConferencesResponseSchema,
  RankingsResponseSchema,
  SeasonsResponseSchema,
  TeamDetailResponseSchema,
  WeeksResponseSchema,
  type AllTimeResponse,
  type ConferencesResponse,
  type RankingsResponse,
  type SeasonsResponse,
  type TeamDetailResponse,
  type WeeksResponse,
} from '../schemas';

export async function fetchSeasons(): Promise<SeasonsResponse> {
  const response = await safeFetch(`${API_BASE_URL}/api/v1/seasons`);
  return parseResponse(response, SeasonsResponseSchema);
}

export async function fetchWeeks(season: number): Promise<WeeksResponse> {
  const response = await safeFetch(`${API_BASE_URL}/api/v1/seasons/${season}/weeks`);
  return parseResponse(response, WeeksResponseSchema);
}

export async function fetchRankings(
  season: number,
  week: number
): Promise<RankingsResponse> {
  const response = await safeFetch(`${API_BASE_URL}/api/v1/rankings?season=${season}&week=${week}`);
  return parseResponse(response, RankingsResponseSchema);
}

export async function fetchConferences(): Promise<ConferencesResponse> {
  const response = await safeFetch(`${API_BASE_URL}/api/v1/conferences`);
  return parseResponse(response, ConferencesResponseSchema);
}

export async function fetchAvailableWeeks(
  season: number
): Promise<WeeksResponse> {
  const response = await safeFetch(`${API_BASE_URL}/api/v1/rankings/available-weeks?season=${season}`);
  return parseResponse(response, WeeksResponseSchema);
}

export async function fetchAllTimeRankings(): Promise<AllTimeResponse> {
  const response = await safeFetch(`${API_BASE_URL}/api/v1/all-time`);
  return parseResponse(response, AllTimeResponseSchema);
}

export async function fetchTeamDetail(
  season: number,
  week: number,
  teamName: string
): Promise<TeamDetailResponse> {
  const response = await safeFetch(
    `${API_BASE_URL}/api/v1/teams/${encodeURIComponent(teamName)}?season=${season}&week=${week}`
  );
  return parseResponse(response, TeamDetailResponseSchema);
}
