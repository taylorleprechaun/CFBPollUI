import type { ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useCacheEntries } from '../../hooks/use-cache-entries';

vi.mock('../../services/admin-api', () => ({
  deleteCacheEntries: vi.fn(),
  deleteCacheEntry: vi.fn(),
  fetchCacheEntries: vi.fn(),
}));

import { deleteCacheEntries, deleteCacheEntry, fetchCacheEntries } from '../../services/admin-api';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const mockEntry = {
  cachedAt: '2026-08-01T00:00:00Z',
  cacheKey: 'teams_2024',
  detail: '',
  expiresAt: '9999-12-31T23:59:59.9999999Z',
  family: 'Teams',
  season: 2024,
  sizeBytes: 100,
};

describe('useCacheEntries', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('deleteMany() calls deleteCacheEntries with the given keys and refetches the list', async () => {
    vi.mocked(fetchCacheEntries).mockResolvedValue([mockEntry]);
    vi.mocked(deleteCacheEntries).mockResolvedValue(2);

    const { result } = renderHook(() => useCacheEntries('test-token'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    await act(async () => {
      await result.current.deleteMany(['teams_2024', 'conferences']);
    });

    expect(deleteCacheEntries).toHaveBeenCalledWith('test-token', ['teams_2024', 'conferences']);
    expect(fetchCacheEntries).toHaveBeenCalledTimes(2);
  });

  it('deleteMany() rejects when there is no token', async () => {
    const { result } = renderHook(() => useCacheEntries(null), {
      wrapper: createWrapper(),
    });

    await expect(result.current.deleteMany(['teams_2024'])).rejects.toThrow('Authentication required');
    expect(deleteCacheEntries).not.toHaveBeenCalled();
  });

  it('deleteOne() calls deleteCacheEntry with the given key and refetches the list', async () => {
    vi.mocked(fetchCacheEntries).mockResolvedValue([mockEntry]);
    vi.mocked(deleteCacheEntry).mockResolvedValue(undefined);

    const { result } = renderHook(() => useCacheEntries('test-token'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    await act(async () => {
      await result.current.deleteOne('teams_2024');
    });

    expect(deleteCacheEntry).toHaveBeenCalledWith('test-token', 'teams_2024');
    expect(fetchCacheEntries).toHaveBeenCalledTimes(2);
  });

  it('deleteOne() rejects when there is no token', async () => {
    const { result } = renderHook(() => useCacheEntries(null), {
      wrapper: createWrapper(),
    });

    await expect(result.current.deleteOne('teams_2024')).rejects.toThrow('Authentication required');
    expect(deleteCacheEntry).not.toHaveBeenCalled();
  });

  it('does not fetch when token is null', () => {
    renderHook(() => useCacheEntries(null), { wrapper: createWrapper() });

    expect(fetchCacheEntries).not.toHaveBeenCalled();
  });

  it('fetches the entry list when a token is present', async () => {
    vi.mocked(fetchCacheEntries).mockResolvedValue([mockEntry]);

    const { result } = renderHook(() => useCacheEntries('test-token'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchCacheEntries).toHaveBeenCalledWith('test-token');
    expect(result.current.data).toEqual([mockEntry]);
  });
});
