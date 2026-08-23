import type { AlgorithmVersion } from '../components/admin/algorithm-versions';

import { API_BASE_URL } from '../lib/config';
import { triggerBlobDownload } from '../lib/download-utils';
import { parseResponse } from '../lib/parse-response';
import { safeFetch } from '../lib/safe-fetch';
import {
  type PageVisibility,
  PageVisibilitySchema,
} from '../schemas';
import {
  type AdminPredictionsResponse,
  AdminPredictionsResponseSchema,
  CacheEntriesResponseSchema,
  type CacheEntry,
  type CalculatePredictionsResponse,
  CalculatePredictionsResponseSchema,
  type CalculateResponse,
  CalculateResponseSchema,
  type CfbdUsage,
  CfbdUsageSchema,
  type ExperimentalCalculateResponse,
  ExperimentalCalculateResponseSchema,
  type ExperimentalPredictionsResponse,
  ExperimentalPredictionsResponseSchema,
  type GradePredictionsResponse,
  GradePredictionsResponseSchema,
  PredictionsSummariesResponseSchema,
  type PredictionsSummary,
  type RefreshCacheResponse,
  RefreshCacheResponseSchema,
  RemoveCacheEntriesResponseSchema,
  type SeasonExperimentalPredictionsResponse,
  SeasonExperimentalPredictionsResponseSchema,
  type Snapshot,
  SnapshotsResponseSchema,
} from '../schemas/admin';

export async function calculateExperimental(
  token: string,
  season: number,
  week: number,
  algorithmVersion: AlgorithmVersion
): Promise<ExperimentalCalculateResponse> {
  const response = await safeFetch(
    `${API_BASE_URL}/api/v1/admin/seasons/${season}/weeks/${week}/experimental/${algorithmVersion}`,
    withAuth(token, { method: 'POST' })
  );
  return parseResponse(response, ExperimentalCalculateResponseSchema);
}

export async function calculateExperimentalPredictions(
  token: string,
  season: number,
  week: number,
  algorithmVersion: AlgorithmVersion
): Promise<ExperimentalPredictionsResponse> {
  const response = await safeFetch(
    `${API_BASE_URL}/api/v1/admin/seasons/${season}/weeks/${week}/experimental/${algorithmVersion}/prediction`,
    withAuth(token, { method: 'POST' })
  );
  return parseResponse(response, ExperimentalPredictionsResponseSchema);
}

export async function calculateExperimentalSeasonPredictions(
  token: string,
  season: number,
  weeks: number[],
  algorithmVersion: AlgorithmVersion
): Promise<SeasonExperimentalPredictionsResponse> {
  const response = await safeFetch(
    `${API_BASE_URL}/api/v1/admin/seasons/${season}/experimental/${algorithmVersion}/predictions`,
    withAuth(token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weeks }),
    })
  );
  return parseResponse(response, SeasonExperimentalPredictionsResponseSchema);
}

export async function calculatePredictions(
  token: string,
  season: number,
  week: number
): Promise<CalculatePredictionsResponse> {
  const response = await safeFetch(
    `${API_BASE_URL}/api/v1/admin/seasons/${season}/weeks/${week}/prediction`,
    withAuth(token, { method: 'POST' })
  );
  return parseResponse(response, CalculatePredictionsResponseSchema);
}

export async function calculateRankings(
  token: string,
  season: number,
  week: number
): Promise<CalculateResponse> {
  const response = await safeFetch(
    `${API_BASE_URL}/api/v1/admin/seasons/${season}/weeks/${week}/snapshot`,
    withAuth(token, { method: 'POST' })
  );
  return parseResponse(response, CalculateResponseSchema);
}

export async function deleteCacheEntries(token: string, cacheKeys: string[]): Promise<number> {
  const response = await safeFetch(
    `${API_BASE_URL}/api/v1/admin/cache`,
    withAuth(token, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cacheKeys),
    })
  );
  const { removedCount } = await parseResponse(response, RemoveCacheEntriesResponseSchema);
  return removedCount;
}

export async function deleteCacheEntry(token: string, cacheKey: string): Promise<void> {
  await safeFetch(
    `${API_BASE_URL}/api/v1/admin/cache/${encodeURIComponent(cacheKey)}`,
    withAuth(token, { method: 'DELETE' })
  );
}

export async function deletePredictions(
  token: string,
  season: number,
  week: number
): Promise<void> {
  await safeFetch(
    `${API_BASE_URL}/api/v1/admin/seasons/${season}/weeks/${week}/prediction`,
    withAuth(token, { method: 'DELETE' })
  );
}

export async function deleteSnapshot(
  token: string,
  season: number,
  week: number
): Promise<void> {
  await safeFetch(
    `${API_BASE_URL}/api/v1/admin/seasons/${season}/weeks/${week}/snapshot`,
    withAuth(token, { method: 'DELETE' })
  );
}

export async function downloadExperimentalExport(
  token: string,
  season: number,
  week: number,
  algorithmVersion: AlgorithmVersion
): Promise<void> {
  const response = await safeFetch(
    `${API_BASE_URL}/api/v1/admin/seasons/${season}/weeks/${week}/experimental/${algorithmVersion}/export`,
    withAuth(token)
  );

  const blob = await response.blob();
  triggerBlobDownload(blob, `Rankings_Experimental_${algorithmVersion}_${season}_Week${week + 1}.xlsx`);
}

export async function downloadExport(
  token: string,
  season: number,
  week: number
): Promise<void> {
  const response = await safeFetch(
    `${API_BASE_URL}/api/v1/admin/seasons/${season}/weeks/${week}/snapshot/export`,
    withAuth(token)
  );

  const blob = await response.blob();
  triggerBlobDownload(blob, `Rankings_${season}_Week${week + 1}.xlsx`);
}

export async function fetchCacheEntries(token: string): Promise<CacheEntry[]> {
  const response = await safeFetch(`${API_BASE_URL}/api/v1/admin/cache`, withAuth(token));
  return parseResponse(response, CacheEntriesResponseSchema);
}

export async function fetchCfbdUsage(
  token: string,
  forceRefresh = false
): Promise<CfbdUsage> {
  const response = await safeFetch(
    `${API_BASE_URL}/api/v1/admin/cfbd-usage${forceRefresh ? '?forceRefresh=true' : ''}`,
    withAuth(token)
  );
  return parseResponse(response, CfbdUsageSchema);
}

export async function fetchPrediction(
  token: string,
  season: number,
  week: number
): Promise<AdminPredictionsResponse> {
  const response = await safeFetch(
    `${API_BASE_URL}/api/v1/admin/seasons/${season}/weeks/${week}/prediction`,
    withAuth(token)
  );
  return parseResponse(response, AdminPredictionsResponseSchema);
}

export async function fetchPredictionsSummaries(
  token: string
): Promise<PredictionsSummary[]> {
  const response = await safeFetch(
    `${API_BASE_URL}/api/v1/admin/predictions`,
    withAuth(token)
  );
  return parseResponse(response, PredictionsSummariesResponseSchema);
}

export async function fetchSnapshots(
  token: string
): Promise<Snapshot[]> {
  const response = await safeFetch(
    `${API_BASE_URL}/api/v1/admin/snapshots`,
    withAuth(token)
  );
  return parseResponse(response, SnapshotsResponseSchema);
}

export async function gradePredictions(
  token: string,
  season: number,
  week: number
): Promise<GradePredictionsResponse> {
  const response = await safeFetch(
    `${API_BASE_URL}/api/v1/admin/seasons/${season}/weeks/${week}/prediction/grade`,
    withAuth(token, { method: 'POST' })
  );
  return parseResponse(response, GradePredictionsResponseSchema);
}

export { loginUser } from './auth-api';

export async function publishGradedResults(
  token: string,
  season: number,
  week: number
): Promise<void> {
  await safeFetch(
    `${API_BASE_URL}/api/v1/admin/seasons/${season}/weeks/${week}/prediction/results`,
    withAuth(token, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished: true }),
    })
  );
}

export async function publishPredictions(
  token: string,
  season: number,
  week: number
): Promise<void> {
  await safeFetch(
    `${API_BASE_URL}/api/v1/admin/seasons/${season}/weeks/${week}/prediction`,
    withAuth(token, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished: true }),
    })
  );
}

export async function publishSnapshot(
  token: string,
  season: number,
  week: number
): Promise<void> {
  await safeFetch(
    `${API_BASE_URL}/api/v1/admin/seasons/${season}/weeks/${week}/snapshot`,
    withAuth(token, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished: true }),
    })
  );
}

export async function refreshCache(
  token: string,
  season: number,
  week: number
): Promise<RefreshCacheResponse> {
  const response = await safeFetch(
    `${API_BASE_URL}/api/v1/admin/seasons/${season}/weeks/${week}/cache`,
    withAuth(token, { method: 'POST' })
  );
  return parseResponse(response, RefreshCacheResponseSchema);
}

export async function updatePageVisibility(
  token: string,
  visibility: PageVisibility
): Promise<PageVisibility> {
  const response = await safeFetch(
    `${API_BASE_URL}/api/v1/page-visibility`,
    withAuth(token, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(visibility),
    })
  );
  return parseResponse(response, PageVisibilitySchema);
}

function withAuth(token: string, options: RequestInit = {}): RequestInit {
  return {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  };
}
