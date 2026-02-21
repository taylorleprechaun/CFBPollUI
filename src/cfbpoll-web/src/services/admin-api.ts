import { API_BASE_URL } from '../lib/config';
import { parseResponse } from '../lib/parse-response';
import { safeFetch } from '../lib/safe-fetch';
import {
  CalculateResponseSchema,
  LoginResponseSchema,
  PersistedWeeksResponseSchema,
  type CalculateResponse,
  type LoginResponse,
  type PersistedWeek,
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
    `${API_BASE_URL}/api/v1/admin/calculate`,
    withAuth(token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ season, week }),
    })
  );
  return parseResponse(response, CalculateResponseSchema);
}

export async function publishSnapshot(
  token: string,
  season: number,
  week: number
): Promise<void> {
  await safeFetch(
    `${API_BASE_URL}/api/v1/admin/snapshots/${season}/${week}/publish`,
    withAuth(token, { method: 'POST' })
  );
}

export async function deleteSnapshot(
  token: string,
  season: number,
  week: number
): Promise<void> {
  await safeFetch(
    `${API_BASE_URL}/api/v1/admin/snapshots/${season}/${week}`,
    withAuth(token, { method: 'DELETE' })
  );
}

export async function fetchPersistedWeeks(
  token: string
): Promise<PersistedWeek[]> {
  const response = await safeFetch(
    `${API_BASE_URL}/api/v1/admin/persisted-weeks`,
    withAuth(token)
  );
  return parseResponse(response, PersistedWeeksResponseSchema);
}

export async function downloadExport(
  token: string,
  season: number,
  week: number
): Promise<void> {
  const response = await safeFetch(
    `${API_BASE_URL}/api/v1/admin/export?season=${season}&week=${week}`,
    withAuth(token)
  );

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Rankings_${season}_Week${week}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
