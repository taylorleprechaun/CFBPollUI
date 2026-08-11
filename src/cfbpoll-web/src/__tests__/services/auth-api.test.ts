import { beforeEach, describe, expect, it, vi } from 'vitest';

import { loginUser } from '../../services/auth-api';

describe('Auth API service', () => {
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

  describe('loginUser - error paths', () => {
    it('handles error response with no JSON body', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('no json')),
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(loginUser('admin', 'pass')).rejects.toThrow();
    });

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
  });
});
