import { ValidationError } from '../lib/api-error';
import { safeFetch } from '../lib/safe-fetch';
import {
  CalculateResponseSchema,
  LoginResponseSchema,
  PersistedWeeksResponseSchema,
  type CalculateResponse,
  type LoginResponse,
  type PersistedWeek,
} from '../schemas/admin';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:5001';

function withAuth(token: string, options: RequestInit = {}): RequestInit {
  return {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  };
}

async function fetchWithAuth<T>(
  url: string,
  token: string,
  schema: import('zod').ZodSchema<T>,
  options: RequestInit = {}
): Promise<T> {
  const response = await safeFetch(url, withAuth(token, options));

  const data = await response.json();
  const result = schema.safeParse(data);

  if (!result.success) {
    throw new ValidationError(result.error);
  }

  return result.data;
}

async function fetchWithAuthNoBody(
  url: string,
  token: string,
  options: RequestInit = {}
): Promise<Response> {
  return safeFetch(url, withAuth(token, options));
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

  const data = await response.json();
  const result = LoginResponseSchema.safeParse(data);

  if (!result.success) {
    throw new ValidationError(result.error);
  }

  return result.data;
}

export async function calculateRankings(
  token: string,
  season: number,
  week: number
): Promise<CalculateResponse> {
  return fetchWithAuth(
    `${API_BASE_URL}/api/v1/admin/calculate`,
    token,
    CalculateResponseSchema,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ season, week }),
    }
  );
}

export async function publishSnapshot(
  token: string,
  season: number,
  week: number
): Promise<void> {
  await fetchWithAuthNoBody(
    `${API_BASE_URL}/api/v1/admin/snapshots/${season}/${week}/publish`,
    token,
    { method: 'POST' }
  );
}

export async function deleteSnapshot(
  token: string,
  season: number,
  week: number
): Promise<void> {
  await fetchWithAuthNoBody(
    `${API_BASE_URL}/api/v1/admin/snapshots/${season}/${week}`,
    token,
    { method: 'DELETE' }
  );
}

export async function fetchPersistedWeeks(
  token: string
): Promise<PersistedWeek[]> {
  return fetchWithAuth(
    `${API_BASE_URL}/api/v1/admin/persisted-weeks`,
    token,
    PersistedWeeksResponseSchema
  );
}

export async function downloadExport(
  token: string,
  season: number,
  week: number
): Promise<void> {
  const response = await fetchWithAuthNoBody(
    `${API_BASE_URL}/api/v1/admin/export?season=${season}&week=${week}`,
    token
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
