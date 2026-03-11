import { ApiError } from './api-error';
import { toErrorMessage } from './error-utils';

export async function safeFetch(url: string, options?: RequestInit): Promise<Response> {
  let response: Response;

  try {
    response = await fetch(url, options);
  } catch (error) {
    throw new ApiError(
      toErrorMessage(error, 'Network request failed'),
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
