import { ApiError } from './api-error';

export async function safeFetch(url: string, options?: RequestInit): Promise<Response> {
  let response: Response;

  try {
    response = await fetch(url, options);
  } catch (error) {
    throw new ApiError(
      error instanceof Error ? error.message : 'Network request failed',
      0
    );
  }

  if (!response.ok) {
    let body: { message?: string; traceId?: string } | undefined;
    try {
      body = await response.json();
    } catch {
    }
    throw ApiError.fromResponse(response, body);
  }

  return response;
}
