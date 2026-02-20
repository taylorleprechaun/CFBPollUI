import { describe, it, expect, vi, beforeEach } from 'vitest';
import { safeFetch } from '../../lib/safe-fetch';
import { ApiError } from '../../lib/api-error';

describe('safeFetch', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns response on success', async () => {
    const mockResponse = { ok: true, status: 200 } as Response;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

    const result = await safeFetch('https://example.com/api');

    expect(result).toBe(mockResponse);
  });

  it('passes options to fetch', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true } as Response);
    vi.stubGlobal('fetch', mockFetch);

    const options = { method: 'POST', headers: { 'Content-Type': 'application/json' } };
    await safeFetch('https://example.com/api', options);

    expect(mockFetch).toHaveBeenCalledWith('https://example.com/api', options);
  });

  it('throws ApiError with message on network Error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Connection refused')));

    await expect(safeFetch('https://example.com/api')).rejects.toThrow('Connection refused');
    await expect(safeFetch('https://example.com/api')).rejects.toBeInstanceOf(ApiError);
  });

  it('throws ApiError with generic message on non-Error network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('string error'));

    await expect(safeFetch('https://example.com/api')).rejects.toThrow('Network request failed');
  });

  it('throws ApiError with JSON body message on HTTP error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: 'Not found', traceId: 'abc-123' }),
    }));

    try {
      await safeFetch('https://example.com/api');
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).message).toBe('Not found');
      expect((error as ApiError).statusCode).toBe(404);
      expect((error as ApiError).traceId).toBe('abc-123');
    }
  });

  it('throws ApiError with status message when JSON body fails to parse', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('no json')),
    }));

    try {
      await safeFetch('https://example.com/api');
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).statusCode).toBe(500);
      expect((error as ApiError).message).toBe('Request failed with status 500');
    }
  });
});
