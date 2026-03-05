import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useSnapshots } from '../../hooks/use-snapshots';

vi.mock('../../services/admin-api', () => ({
  fetchSnapshots: vi.fn(),
}));

import { fetchSnapshots } from '../../services/admin-api';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useSnapshots', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('does not fetch when token is null', () => {
    renderHook(() => useSnapshots(null), { wrapper: createWrapper() });

    expect(fetchSnapshots).not.toHaveBeenCalled();
  });

  it('fetches when token is provided', async () => {
    const mockData = [
      { season: 2024, week: 1, isPublished: true, createdAt: '2024-09-01T00:00:00Z' },
    ];
    vi.mocked(fetchSnapshots).mockResolvedValue(mockData);

    const { result } = renderHook(() => useSnapshots('test-token'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchSnapshots).toHaveBeenCalledWith('test-token');
    expect(result.current.data).toEqual(mockData);
  });

  it('returns error on fetch failure', async () => {
    vi.mocked(fetchSnapshots).mockRejectedValue(new Error('Server error'));

    const { result } = renderHook(() => useSnapshots('test-token'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(Error);
  });
});
