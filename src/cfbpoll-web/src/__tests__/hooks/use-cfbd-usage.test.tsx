import type { ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useCfbdUsage } from '../../hooks/use-cfbd-usage';

vi.mock('../../services/admin-api', () => ({
  fetchCfbdUsage: vi.fn(),
}));

import { fetchCfbdUsage } from '../../services/admin-api';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const mockUsage = {
  monthlyLimit: 1000,
  remainingCalls: 900,
  resetAt: '2026-09-01T00:00:00Z',
  tierName: 'Patron',
  topEndpoints: [],
  totalRequestsInWindow: 100,
  usedCalls: 100,
};

describe('useCfbdUsage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('does not fetch when token is null', () => {
    renderHook(() => useCfbdUsage(null), { wrapper: createWrapper() });

    expect(fetchCfbdUsage).not.toHaveBeenCalled();
  });

  it('fetches without forcing a refresh on initial load', async () => {
    vi.mocked(fetchCfbdUsage).mockResolvedValue(mockUsage);

    const { result } = renderHook(() => useCfbdUsage('test-token'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchCfbdUsage).toHaveBeenCalledWith('test-token', false);
    expect(result.current.data).toEqual(mockUsage);
  });

  it('refresh() forces a live fetch and writes the result into the cache', async () => {
    const refreshedUsage = { ...mockUsage, remainingCalls: 850 };
    vi.mocked(fetchCfbdUsage).mockResolvedValueOnce(mockUsage).mockResolvedValueOnce(refreshedUsage);

    const { result } = renderHook(() => useCfbdUsage('test-token'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    act(() => {
      result.current.refresh();
    });

    await waitFor(() => expect(result.current.data).toEqual(refreshedUsage));

    expect(fetchCfbdUsage).toHaveBeenCalledWith('test-token', true);
  });
});
