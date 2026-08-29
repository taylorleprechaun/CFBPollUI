import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  calculateExperimental,
  calculateExperimentalPredictions,
  calculateExperimentalSeasonPredictions,
  calculatePredictions,
  calculateRankings,
  deleteCacheEntries,
  deleteCacheEntry,
  deletePredictions,
  deleteRankingsSnapshot,
  downloadExperimentalExport,
  downloadExport,
  fetchCacheEntries,
  fetchCfbdUsage,
  fetchPrediction,
  fetchPredictionsSummaries,
  fetchRankingsSnapshots,
  gradePredictions,
  publishGradedResults,
  publishPredictions,
  publishRankingsSnapshot,
  refreshCache,
  updatePageVisibility,
} from '../../services/admin-api';

describe('Admin API service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('calculateExperimental', () => {
    it('sends POST to experimental endpoint with auth header', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            algorithmVersion: 'V2',
            rankings: { season: 2024, week: 5, rankings: [] },
          }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await calculateExperimental('my-token', 2024, 5, 'V2');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/seasons/2024/weeks/5/experimental/V2'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer my-token',
          }),
        })
      );
    });

    it('throws on failed calculate', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Server error' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(calculateExperimental('token', 2024, 5, 'V1')).rejects.toThrow('Server error');
    });
  });

  describe('calculateExperimentalPredictions', () => {
    it('sends POST to experimental prediction endpoint with auth header', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            algorithmVersion: 'V2',
            predictions: [],
            summary: {
              gradedGameCount: 0,
              marginBias: null,
              marginMAE: null,
              marginRMSE: null,
              overUnder: { correct: 0, incorrect: 0, push: 0 },
              spread: { correct: 0, incorrect: 0, push: 0 },
              winner: { correct: 0, incorrect: 0, push: 0 },
            },
          }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await calculateExperimentalPredictions('my-token', 2024, 5, 'V2');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/seasons/2024/weeks/5/experimental/V2/prediction'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer my-token',
          }),
        })
      );
    });

    it('throws on failed calculate', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Server error' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(calculateExperimentalPredictions('token', 2024, 5, 'V1')).rejects.toThrow('Server error');
    });
  });

  describe('calculateExperimentalSeasonPredictions', () => {
    it('sends POST to season experimental predictions endpoint with weeks body and auth header', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            algorithmVersion: 'V2',
            overallSummary: {
              gradedGameCount: 0,
              marginBias: null,
              marginMAE: null,
              marginRMSE: null,
              overUnder: { correct: 0, incorrect: 0, push: 0 },
              spread: { correct: 0, incorrect: 0, push: 0 },
              winner: { correct: 0, incorrect: 0, push: 0 },
            },
            season: 2024,
            weeks: [],
          }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await calculateExperimentalSeasonPredictions('my-token', 2024, [5, 6], 'V2');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/seasons/2024/experimental/V2/predictions'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ weeks: [5, 6] }),
          headers: expect.objectContaining({
            Authorization: 'Bearer my-token',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('throws on failed calculate', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Server error' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(calculateExperimentalSeasonPredictions('token', 2024, [5], 'V1')).rejects.toThrow('Server error');
    });
  });

  describe('calculatePredictions', () => {
    it('sends POST to prediction endpoint with auth header', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            isPersisted: true,
            predictions: { isGraded: false, resultsPublished: false, season: 2024, week: 5, predictions: [] },
          }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await calculatePredictions('my-token', 2024, 5);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/seasons/2024/weeks/5/prediction'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer my-token',
          }),
        })
      );
    });

    it('throws on failed calculate', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Server error' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(calculatePredictions('token', 2024, 5)).rejects.toThrow('Server error');
    });
  });

  describe('calculateRankings', () => {
    it('sends POST with auth header and body', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            isPersisted: true,
            rankings: { season: 2024, week: 5, rankings: [] },
          }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await calculateRankings('my-token', 2024, 5);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/seasons/2024/weeks/5/rankings-snapshot'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer my-token',
          }),
        })
      );
    });
  });

  describe('calculateRankings - error paths', () => {
    it('handles error response with no JSON body', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        json: () => Promise.reject(new Error('no body')),
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(calculateRankings('token', 2024, 5)).rejects.toThrow();
    });

    it('throws on failed calculate', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Server error' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(calculateRankings('token', 2024, 5)).rejects.toThrow('Server error');
    });

    it('throws on network failure', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Connection refused'));
      vi.stubGlobal('fetch', mockFetch);

      await expect(calculateRankings('token', 2024, 5)).rejects.toThrow('Connection refused');
    });

    it('throws on non-Error network failure', async () => {
      const mockFetch = vi.fn().mockRejectedValue('timeout');
      vi.stubGlobal('fetch', mockFetch);

      await expect(calculateRankings('token', 2024, 5)).rejects.toThrow('Network request failed');
    });
  });

  describe('deleteCacheEntries', () => {
    it('returns removedCount from the response', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ removedCount: 2 }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await deleteCacheEntries('my-token', ['teams_2024', 'conferences']);

      expect(result).toBe(2);
    });

    it('sends DELETE with a JSON body of keys and auth header', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ removedCount: 2 }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await deleteCacheEntries('my-token', ['teams_2024', 'conferences']);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/cache'),
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            Authorization: 'Bearer my-token',
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(['teams_2024', 'conferences']),
        })
      );
    });

    it('throws on failed delete', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: 'At least one cache key is required' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(deleteCacheEntries('token', [])).rejects.toThrow('At least one cache key is required');
    });
  });

  describe('deleteCacheEntry', () => {
    it('sends DELETE to the cache entry endpoint with the key encoded and auth header', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });
      vi.stubGlobal('fetch', mockFetch);

      await deleteCacheEntry('my-token', 'teams_2024');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/cache/teams_2024'),
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            Authorization: 'Bearer my-token',
          }),
        })
      );
    });

    it('throws on failed delete', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'Cache entry not found' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(deleteCacheEntry('token', 'teams_2024')).rejects.toThrow('Cache entry not found');
    });
  });

  describe('deletePredictions', () => {
    it('sends DELETE to prediction endpoint with auth header', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });
      vi.stubGlobal('fetch', mockFetch);

      await deletePredictions('my-token', 2024, 5);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/seasons/2024/weeks/5/prediction'),
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            Authorization: 'Bearer my-token',
          }),
        })
      );
    });

    it('throws on failed delete', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'Not found' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(deletePredictions('token', 2024, 5)).rejects.toThrow('Not found');
    });
  });

  describe('deleteRankingsSnapshot', () => {
    it('sends DELETE to rankings snapshot endpoint with auth header', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });
      vi.stubGlobal('fetch', mockFetch);

      await deleteRankingsSnapshot('my-token', 2024, 5);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/seasons/2024/weeks/5/rankings-snapshot'),
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            Authorization: 'Bearer my-token',
          }),
        })
      );
    });
  });

  describe('deleteRankingsSnapshot - error paths', () => {
    it('throws on failed delete', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'Not found' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(deleteRankingsSnapshot('token', 2024, 5)).rejects.toThrow('Not found');
    });

    it('throws on network failure', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Connection reset'));
      vi.stubGlobal('fetch', mockFetch);

      await expect(deleteRankingsSnapshot('token', 2024, 5)).rejects.toThrow('Connection reset');
    });
  });

  describe('downloadExperimentalExport', () => {
    it('fetches experimental export with auth header and triggers download', async () => {
      const mockBlob = new Blob(['test'], { type: 'application/octet-stream' });
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      });
      vi.stubGlobal('fetch', mockFetch);

      const mockCreateObjectURL = vi.fn().mockReturnValue('blob:test-url');
      const mockRevokeObjectURL = vi.fn();
      vi.stubGlobal('URL', { createObjectURL: mockCreateObjectURL, revokeObjectURL: mockRevokeObjectURL });

      const mockClick = vi.fn();
      const mockAnchor = {
        href: '',
        download: '',
        click: mockClick,
      } as unknown as HTMLAnchorElement;
      const mockAppendChild = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
      const mockRemoveChild = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor);

      await downloadExperimentalExport('my-token', 2024, 5, 'V2');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/seasons/2024/weeks/5/experimental/V2/export'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer my-token',
          }),
        })
      );
      expect(mockClick).toHaveBeenCalled();
      expect(mockAnchor.download).toBe('Rankings_Experimental_V2_2024_Week6.xlsx');

      mockAppendChild.mockRestore();
      mockRemoveChild.mockRestore();
    });

    it('throws on failed export', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'Not found' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(downloadExperimentalExport('token', 2024, 5, 'V1')).rejects.toThrow('Not found');
    });
  });

  describe('downloadExport', () => {
    it('fetches export with auth header and triggers download', async () => {
      const mockBlob = new Blob(['test'], { type: 'application/octet-stream' });
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      });
      vi.stubGlobal('fetch', mockFetch);

      const mockCreateObjectURL = vi.fn().mockReturnValue('blob:test-url');
      const mockRevokeObjectURL = vi.fn();
      vi.stubGlobal('URL', { createObjectURL: mockCreateObjectURL, revokeObjectURL: mockRevokeObjectURL });

      const mockClick = vi.fn();
      const mockAnchor = {
        href: '',
        download: '',
        click: mockClick,
      } as unknown as HTMLAnchorElement;
      const mockAppendChild = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
      const mockRemoveChild = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor);

      await downloadExport('my-token', 2024, 5);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/seasons/2024/weeks/5/rankings-snapshot/export'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer my-token',
          }),
        })
      );
      expect(mockClick).toHaveBeenCalled();
      expect(mockAnchor.download).toBe('Rankings_2024_Week6.xlsx');

      mockAppendChild.mockRestore();
      mockRemoveChild.mockRestore();
    });

    it('throws on failed export', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'Not found' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(downloadExport('token', 2024, 5)).rejects.toThrow('Not found');
    });
  });

  describe('fetchCacheEntries', () => {
    it('returns the parsed list of cache entries', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              cachedAt: '2026-08-01T00:00:00Z',
              cacheKey: 'teams_2024',
              detail: '',
              expiresAt: '9999-12-31T23:59:59.9999999Z',
              family: 'Teams',
              season: 2024,
              sizeBytes: 100,
            },
          ]),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await fetchCacheEntries('my-token');

      expect(result).toHaveLength(1);
      expect(result[0].cacheKey).toBe('teams_2024');
    });

    it('sends GET to the cache endpoint with auth header', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });
      vi.stubGlobal('fetch', mockFetch);

      await fetchCacheEntries('my-token');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/cache'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer my-token',
          }),
        })
      );
    });
  });

  describe('fetchCfbdUsage', () => {
    it('appends forceRefresh query param when requested', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            monthlyLimit: 1000,
            remainingCalls: 850,
            resetAt: '2026-09-01T00:00:00Z',
            tierName: 'Patron',
            topEndpoints: [],
            totalRequestsInWindow: 150,
            usedCalls: 150,
          }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await fetchCfbdUsage('my-token', true);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/cfbd-usage?forceRefresh=true'),
        expect.anything()
      );
    });

    it('sends GET to cfbd-usage with auth header and no forceRefresh param by default', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            monthlyLimit: 1000,
            remainingCalls: 900,
            resetAt: '2026-09-01T00:00:00Z',
            tierName: 'Patron',
            topEndpoints: [],
            totalRequestsInWindow: 100,
            usedCalls: 100,
          }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await fetchCfbdUsage('my-token');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/v1\/admin\/cfbd-usage$/),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer my-token',
          }),
        })
      );
      expect(result.remainingCalls).toBe(900);
    });

    it('throws on failed fetch', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'CFBD unreachable' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(fetchCfbdUsage('token')).rejects.toThrow('CFBD unreachable');
    });
  });

  describe('fetchPrediction', () => {
    it('sends GET to prediction endpoint with auth header', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            isPublished: true,
            predictions: { isGraded: true, resultsPublished: false, season: 2024, week: 5, predictions: [] },
          }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await fetchPrediction('my-token', 2024, 5);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/seasons/2024/weeks/5/prediction'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer my-token',
          }),
        })
      );
      expect(result.isPublished).toBe(true);
      expect(result.predictions.isGraded).toBe(true);
    });

    it('throws on failed fetch', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'Not found' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(fetchPrediction('token', 2024, 5)).rejects.toThrow('Not found');
    });
  });

  describe('fetchPredictionsSummaries', () => {
    it('sends GET to predictions with auth header', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve([
            { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z', gameCount: 10, gradedAt: null, isGraded: false, resultsPublished: false },
          ]),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await fetchPredictionsSummaries('my-token');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/predictions'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer my-token',
          }),
        })
      );
      expect(result).toHaveLength(1);
    });

    it('throws on failed fetch', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'DB error' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(fetchPredictionsSummaries('token')).rejects.toThrow('DB error');
    });
  });

  describe('fetchRankingsSnapshots', () => {
    it('sends GET to rankings snapshots with auth header', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve([
            { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z' },
          ]),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await fetchRankingsSnapshots('my-token');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/rankings-snapshots'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer my-token',
          }),
        })
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('fetchRankingsSnapshots - error paths', () => {
    it('throws on failed fetch', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'DB error' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(fetchRankingsSnapshots('token')).rejects.toThrow('DB error');
    });

    it('throws on network failure', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Timeout'));
      vi.stubGlobal('fetch', mockFetch);

      await expect(fetchRankingsSnapshots('token')).rejects.toThrow('Timeout');
    });
  });

  describe('gradePredictions', () => {
    it('sends POST to grade endpoint with auth header', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            isPersisted: true,
            predictions: { isGraded: true, resultsPublished: true, season: 2024, week: 5, predictions: [] },
            unmatchedGameCount: 0,
          }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await gradePredictions('my-token', 2024, 5);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/seasons/2024/weeks/5/prediction/grade'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer my-token',
          }),
        })
      );
    });

    it('throws on failed grade', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'Not found' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(gradePredictions('token', 2024, 5)).rejects.toThrow('Not found');
    });
  });

  describe('publishGradedResults', () => {
    it('sends PATCH to results endpoint with auth header and body', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });
      vi.stubGlobal('fetch', mockFetch);

      await publishGradedResults('my-token', 2024, 5);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/seasons/2024/weeks/5/prediction/results'),
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({
            Authorization: 'Bearer my-token',
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({ isPublished: true }),
        })
      );
    });

    it('throws on failed publish', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'Not found' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(publishGradedResults('token', 2024, 5)).rejects.toThrow('Not found');
    });
  });

  describe('publishPredictions', () => {
    it('sends PATCH to prediction endpoint with auth header and body', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });
      vi.stubGlobal('fetch', mockFetch);

      await publishPredictions('my-token', 2024, 5);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/seasons/2024/weeks/5/prediction'),
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({
            Authorization: 'Bearer my-token',
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({ isPublished: true }),
        })
      );
    });

    it('throws on failed publish', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'Not found' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(publishPredictions('token', 2024, 5)).rejects.toThrow('Not found');
    });
  });

  describe('publishRankingsSnapshot', () => {
    it('sends PATCH to rankings snapshot endpoint with auth header and body', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });
      vi.stubGlobal('fetch', mockFetch);

      await publishRankingsSnapshot('my-token', 2024, 5);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/seasons/2024/weeks/5/rankings-snapshot'),
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({
            Authorization: 'Bearer my-token',
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({ isPublished: true }),
        })
      );
    });
  });

  describe('publishRankingsSnapshot - error paths', () => {
    it('handles error response with no JSON body', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('no body')),
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(publishRankingsSnapshot('token', 2024, 5)).rejects.toThrow();
    });

    it('throws on failed publish', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'Not found' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(publishRankingsSnapshot('token', 2024, 5)).rejects.toThrow('Not found');
    });

    it('throws on network failure', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      vi.stubGlobal('fetch', mockFetch);

      await expect(publishRankingsSnapshot('token', 2024, 5)).rejects.toThrow('Network error');
    });

    it('throws on non-Error network failure', async () => {
      const mockFetch = vi.fn().mockRejectedValue(42);
      vi.stubGlobal('fetch', mockFetch);

      await expect(publishRankingsSnapshot('token', 2024, 5)).rejects.toThrow('Network request failed');
    });
  });

  describe('refreshCache', () => {
    it('sends POST to cache endpoint with auth header', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ removedCount: 8, season: 2024, week: 5 }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await refreshCache('my-token', 2024, 5);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/seasons/2024/weeks/5/cache'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer my-token',
          }),
        })
      );
      expect(result.removedCount).toBe(8);
      expect(result.season).toBe(2024);
      expect(result.week).toBe(5);
    });

    it('throws on failed refresh', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Server error' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(refreshCache('token', 2024, 5)).rejects.toThrow('Server error');
    });

    it('throws on network failure', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Connection refused'));
      vi.stubGlobal('fetch', mockFetch);

      await expect(refreshCache('token', 2024, 5)).rejects.toThrow('Connection refused');
    });
  });

  describe('updatePageVisibility', () => {
    it('sends PUT with auth header and JSON body', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ allTimeEnabled: true, pollLeadersEnabled: true, predictionsPageEnabled: true, seasonTrendsEnabled: true }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await updatePageVisibility('my-token', {
        allTimeEnabled: true,
        pollLeadersEnabled: true,
        predictionsPageEnabled: true,
        seasonTrendsEnabled: true,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/page-visibility'),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            Authorization: 'Bearer my-token',
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({ allTimeEnabled: true, pollLeadersEnabled: true, predictionsPageEnabled: true, seasonTrendsEnabled: true }),
        })
      );
      expect(result.allTimeEnabled).toBe(true);
      expect(result.pollLeadersEnabled).toBe(true);
      expect(result.predictionsPageEnabled).toBe(true);
      expect(result.seasonTrendsEnabled).toBe(true);
    });

    it('throws on HTTP error', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ message: 'Forbidden' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(
        updatePageVisibility('bad-token', {
          allTimeEnabled: true,
          pollLeadersEnabled: true,
          predictionsPageEnabled: true,
          seasonTrendsEnabled: true,
        })
      ).rejects.toThrow('Forbidden');
    });

    it('validates response against PageVisibilitySchema', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ allTimeEnabled: false, pollLeadersEnabled: false, predictionsPageEnabled: false, seasonTrendsEnabled: false }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await updatePageVisibility('my-token', {
        allTimeEnabled: false,
        pollLeadersEnabled: false,
        predictionsPageEnabled: false,
        seasonTrendsEnabled: false,
      });

      expect(result).toEqual({ allTimeEnabled: false, pollLeadersEnabled: false, predictionsPageEnabled: false, seasonTrendsEnabled: false });
    });
  });
});
