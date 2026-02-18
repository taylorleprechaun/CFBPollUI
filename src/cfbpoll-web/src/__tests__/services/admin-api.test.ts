import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  loginUser,
  calculateRankings,
  publishSnapshot,
  deleteSnapshot,
  downloadExport,
  fetchPersistedWeeks,
} from '../../services/admin-api';

describe('Admin API service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('loginUser', () => {
    it('sends POST to auth/login with credentials', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ token: 'test-token', expiresIn: 28800 }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await loginUser('admin', 'password');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/auth/login'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ username: 'admin', password: 'password' }),
        })
      );
      expect(result.token).toBe('test-token');
      expect(result.expiresIn).toBe(28800);
    });

    it('throws on failed login', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Invalid credentials' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(loginUser('admin', 'wrong')).rejects.toThrow('Invalid credentials');
    });
  });

  describe('calculateRankings', () => {
    it('sends POST with auth header and body', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            persisted: true,
            rankings: { season: 2024, week: 5, rankings: [] },
          }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await calculateRankings('my-token', 2024, 5);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/calculate'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer my-token',
          }),
        })
      );
    });
  });

  describe('publishSnapshot', () => {
    it('sends POST to publish endpoint with auth header', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });
      vi.stubGlobal('fetch', mockFetch);

      await publishSnapshot('my-token', 2024, 5);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/snapshots/2024/5/publish'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer my-token',
          }),
        })
      );
    });
  });

  describe('deleteSnapshot', () => {
    it('sends DELETE to snapshot endpoint with auth header', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });
      vi.stubGlobal('fetch', mockFetch);

      await deleteSnapshot('my-token', 2024, 5);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/snapshots/2024/5'),
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            Authorization: 'Bearer my-token',
          }),
        })
      );
    });
  });

  describe('fetchPersistedWeeks', () => {
    it('sends GET to persisted-weeks with auth header', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve([
            { season: 2024, week: 1, published: true, createdAt: '2024-09-01T00:00:00Z' },
          ]),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await fetchPersistedWeeks('my-token');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/persisted-weeks'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer my-token',
          }),
        })
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('loginUser - error paths', () => {
    it('throws on network failure', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      vi.stubGlobal('fetch', mockFetch);

      await expect(loginUser('admin', 'pass')).rejects.toThrow('Network error');
    });

    it('throws on non-Error network failure', async () => {
      const mockFetch = vi.fn().mockRejectedValue('string error');
      vi.stubGlobal('fetch', mockFetch);

      await expect(loginUser('admin', 'pass')).rejects.toThrow('Network request failed');
    });

    it('handles error response with no JSON body', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('no json')),
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(loginUser('admin', 'pass')).rejects.toThrow();
    });
  });

  describe('calculateRankings - error paths', () => {
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

    it('handles error response with no JSON body', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        json: () => Promise.reject(new Error('no body')),
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(calculateRankings('token', 2024, 5)).rejects.toThrow();
    });
  });

  describe('publishSnapshot - error paths', () => {
    it('throws on failed publish', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'Not found' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(publishSnapshot('token', 2024, 5)).rejects.toThrow('Not found');
    });

    it('throws on network failure', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      vi.stubGlobal('fetch', mockFetch);

      await expect(publishSnapshot('token', 2024, 5)).rejects.toThrow('Network error');
    });

    it('throws on non-Error network failure', async () => {
      const mockFetch = vi.fn().mockRejectedValue(42);
      vi.stubGlobal('fetch', mockFetch);

      await expect(publishSnapshot('token', 2024, 5)).rejects.toThrow('Network request failed');
    });

    it('handles error response with no JSON body', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('no body')),
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(publishSnapshot('token', 2024, 5)).rejects.toThrow();
    });
  });

  describe('deleteSnapshot - error paths', () => {
    it('throws on failed delete', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'Not found' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(deleteSnapshot('token', 2024, 5)).rejects.toThrow('Not found');
    });

    it('throws on network failure', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Connection reset'));
      vi.stubGlobal('fetch', mockFetch);

      await expect(deleteSnapshot('token', 2024, 5)).rejects.toThrow('Connection reset');
    });
  });

  describe('fetchPersistedWeeks - error paths', () => {
    it('throws on failed fetch', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'DB error' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(fetchPersistedWeeks('token')).rejects.toThrow('DB error');
    });

    it('throws on network failure', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Timeout'));
      vi.stubGlobal('fetch', mockFetch);

      await expect(fetchPersistedWeeks('token')).rejects.toThrow('Timeout');
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
      const mockAppendChild = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
      const mockRemoveChild = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);
      vi.spyOn(document, 'createElement').mockReturnValue({
        href: '',
        download: '',
        click: mockClick,
      } as unknown as HTMLAnchorElement);

      await downloadExport('my-token', 2024, 5);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/export?season=2024&week=5'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer my-token',
          }),
        })
      );
      expect(mockClick).toHaveBeenCalled();

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
});
