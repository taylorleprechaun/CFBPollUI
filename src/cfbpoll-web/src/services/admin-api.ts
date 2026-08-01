import { API_BASE_URL } from '../lib/config';
import { triggerBlobDownload } from '../lib/download-utils';
import { parseResponse } from '../lib/parse-response';
import { safeFetch } from '../lib/safe-fetch';

import {
  PageVisibilitySchema,
  type PageVisibility,
} from '../schemas';

import {
  AdminPredictionsResponseSchema,
  CalculatePredictionsResponseSchema,
  CalculateResponseSchema,
  GradePredictionsResponseSchema,
  LoginResponseSchema,
  PredictionsSummariesResponseSchema,
  RefreshCacheResponseSchema,
  SnapshotsResponseSchema,
  type AdminPredictionsResponse,
  type CalculatePredictionsResponse,
  type CalculateResponse,
  type GradePredictionsResponse,
  type LoginResponse,
  type PredictionsSummary,
  type RefreshCacheResponse,
  type Snapshot,
} from '../schemas/admin';

function withAuth(token: string, options: RequestInit = {}): RequestInit {
  return {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  };
}

export async function loginUser(
  username: string,
  password: string
): Promise<LoginResponse> {
  const response = await safeFetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return parseResponse(response, LoginResponseSchema);
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

export async function fetchSnapshots(
  token: string
): Promise<Snapshot[]> {
  const response = await safeFetch(
    `${API_BASE_URL}/api/v1/admin/snapshots`,
    withAuth(token)
  );
  return parseResponse(response, SnapshotsResponseSchema);
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
  triggerBlobDownload(blob, `Rankings_${season}_Week${week}.xlsx`);
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

export async function fetchPredictionsSummaries(
  token: string
): Promise<PredictionsSummary[]> {
  const response = await safeFetch(
    `${API_BASE_URL}/api/v1/admin/predictions`,
    withAuth(token)
  );
  return parseResponse(response, PredictionsSummariesResponseSchema);
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
