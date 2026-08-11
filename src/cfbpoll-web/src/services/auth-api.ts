import { API_BASE_URL } from '../lib/config';
import { parseResponse } from '../lib/parse-response';
import { safeFetch } from '../lib/safe-fetch';
import { type LoginResponse, LoginResponseSchema } from '../schemas/admin';

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
