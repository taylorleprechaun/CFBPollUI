import { API_BASE_URL } from '../lib/config';
import { parseResponse } from '../lib/parse-response';
import { safeFetch } from '../lib/safe-fetch';

import {
  AllTimeResponseSchema,
  ConferencesResponseSchema,
  PageVisibilitySchema,
  PollLeadersResponseSchema,
  RankingsResponseSchema,
  SeasonsResponseSchema,
  TeamDetailResponseSchema,
  WeeksResponseSchema,
  type AllTimeResponse,
  type ConferencesResponse,
  type PageVisibility,
  type PollLeadersResponse,
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
  const response = await safeFetch(`${API_BASE_URL}/api/v1/seasons/${season}/weeks/${week}/rankings`);
  return parseResponse(response, RankingsResponseSchema);
}

export async function fetchConferences(): Promise<ConferencesResponse> {
  const response = await safeFetch(`${API_BASE_URL}/api/v1/conferences`);
  return parseResponse(response, ConferencesResponseSchema);
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

export async function fetchPageVisibility(): Promise<PageVisibility> {
  const response = await safeFetch(`${API_BASE_URL}/api/v1/page-visibility`);
  return parseResponse(response, PageVisibilitySchema);
}

export async function fetchPollLeaders(
  minSeason?: number,
  maxSeason?: number
): Promise<PollLeadersResponse> {
  const params = new URLSearchParams();
  if (minSeason !== undefined) params.set('minSeason', String(minSeason));
  if (maxSeason !== undefined) params.set('maxSeason', String(maxSeason));
  const query = params.toString();
  const url = `${API_BASE_URL}/api/v1/poll-leaders${query ? `?${query}` : ''}`;
  const response = await safeFetch(url);
  return parseResponse(response, PollLeadersResponseSchema);
}
