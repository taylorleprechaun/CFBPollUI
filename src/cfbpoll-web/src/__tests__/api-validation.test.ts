import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ZodError } from 'zod';
import { ApiError, ValidationError } from '../lib/api-error';
import { fetchSeasons, fetchWeeks, fetchRankings } from '../services/api';

describe('API Error Classes', () => {
  describe('ApiError', () => {
    it('creates error with correct properties', () => {
      const error = new ApiError('Test error', 404, 'trace-123');
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(404);
      expect(error.traceId).toBe('trace-123');
      expect(error.name).toBe('ApiError');
    });

    it('identifies network errors', () => {
      const error = new ApiError('Network error', 0);
      expect(error.isNetworkError).toBe(true);
      expect(error.isClientError).toBe(false);
      expect(error.isServerError).toBe(false);
    });

    it('identifies client errors (4xx)', () => {
      const error = new ApiError('Not found', 404);
      expect(error.isNetworkError).toBe(false);
      expect(error.isClientError).toBe(true);
      expect(error.isServerError).toBe(false);
    });

    it('identifies server errors (5xx)', () => {
      const error = new ApiError('Server error', 500);
      expect(error.isNetworkError).toBe(false);
      expect(error.isClientError).toBe(false);
      expect(error.isServerError).toBe(true);
    });

    it('creates error from response', () => {
      const response = { ok: false, status: 400 } as Response;
      const body = { message: 'Bad request', traceId: 'trace-456' };
      const error = ApiError.fromResponse(response, body);

      expect(error.message).toBe('Bad request');
      expect(error.statusCode).toBe(400);
      expect(error.traceId).toBe('trace-456');
    });

    it('uses default message when body has no message', () => {
      const response = { ok: false, status: 500 } as Response;
      const error = ApiError.fromResponse(response, undefined);

      expect(error.message).toBe('Request failed with status 500');
    });
  });

  describe('ValidationError', () => {
    it('creates error from ZodError', () => {
      const zodError = new ZodError([
        {
          code: 'invalid_type',
          expected: 'number',
          received: 'string',
          path: ['seasons', 0],
          message: 'Expected number, received string',
        },
      ]);

      const error = new ValidationError(zodError);
      expect(error.name).toBe('ValidationError');
      expect(error.message).toContain('Validation failed');
      expect(error.errors).toHaveLength(1); // errors property is copied from zodError.issues
    });
  });
});

describe('API Functions with Validation', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('fetchSeasons', () => {
    it('returns validated data on success', async () => {
      const mockResponse = { seasons: [2024, 2023, 2022] };
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await fetchSeasons();
      expect(result.seasons).toEqual([2024, 2023, 2022]);
    });

    it('throws ApiError on HTTP error', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Server error' }),
      } as Response);

      await expect(fetchSeasons()).rejects.toThrow(ApiError);
    });

    it('throws ValidationError on invalid response', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ invalid: 'data' }),
      } as Response);

      await expect(fetchSeasons()).rejects.toThrow(ValidationError);
    });

    it('throws ApiError on network failure', async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

      await expect(fetchSeasons()).rejects.toThrow(ApiError);
    });
  });

  describe('fetchWeeks', () => {
    it('returns validated data on success', async () => {
      const mockResponse = {
        season: 2024,
        weeks: [
          { weekNumber: 1, label: 'Week 1' },
          { weekNumber: 2, label: 'Week 2' },
        ],
      };
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await fetchWeeks(2024);
      expect(result.season).toBe(2024);
      expect(result.weeks).toHaveLength(2);
    });
  });

  describe('fetchRankings', () => {
    it('returns validated data on success', async () => {
      const mockResponse = {
        season: 2024,
        week: 5,
        rankings: [
          {
            rank: 1,
            teamName: 'Georgia',
            logoURL: 'https://example.com/logo.png',
            conference: 'SEC',
            division: 'East',
            wins: 5,
            losses: 0,
            record: '5-0',
            rating: 85.5,
            weightedSOS: 0.65,
            sosRanking: 5,
          },
        ],
      };
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await fetchRankings(2024, 5);
      expect(result.season).toBe(2024);
      expect(result.week).toBe(5);
      expect(result.rankings).toHaveLength(1);
    });
  });
});
