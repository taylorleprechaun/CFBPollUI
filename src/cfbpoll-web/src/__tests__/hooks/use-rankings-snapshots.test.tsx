import type { ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useRankingsSnapshots } from '../../hooks/use-rankings-snapshots';

vi.mock('../../services/admin-api', () => ({
  fetchRankingsSnapshots: vi.fn(),
}));

import { fetchRankingsSnapshots } from '../../services/admin-api';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useRankingsSnapshots', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('does not fetch when token is null', () => {
    renderHook(() => useRankingsSnapshots(null), { wrapper: createWrapper() });

    expect(fetchRankingsSnapshots).not.toHaveBeenCalled();
  });

  it('fetches when token is provided', async () => {
    const mockData = [
      { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z' },
    ];
    vi.mocked(fetchRankingsSnapshots).mockResolvedValue(mockData);

    const { result } = renderHook(() => useRankingsSnapshots('test-token'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchRankingsSnapshots).toHaveBeenCalledWith('test-token');
    expect(result.current.data).toEqual(mockData);
  });

  it('returns error on fetch failure', async () => {
    vi.mocked(fetchRankingsSnapshots).mockRejectedValue(new Error('Server error'));

    const { result } = renderHook(() => useRankingsSnapshots('test-token'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(Error);
  });
});
