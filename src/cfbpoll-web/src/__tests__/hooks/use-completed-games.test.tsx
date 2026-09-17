import type { ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useCompletedGames } from '../../hooks/use-completed-games';

vi.mock('../../services/admin-api', () => ({
  fetchCompletedGames: vi.fn(),
}));

import { fetchCompletedGames } from '../../services/admin-api';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const mockResponse = {
  games: [
    {
      awayPoints: 21,
      awayTeam: 'Iowa',
      gameID: 401234561,
      hasOverride: false,
      homePoints: 24,
      homeTeam: 'Nebraska',
      seasonType: 'regular',
    },
  ],
  season: 2025,
  week: 4,
};

describe('useCompletedGames', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('does not fetch when disabled', () => {
    renderHook(() => useCompletedGames('test-token', 2025, 4, false), { wrapper: createWrapper() });

    expect(fetchCompletedGames).not.toHaveBeenCalled();
  });

  it('does not fetch when season is null', () => {
    renderHook(() => useCompletedGames('test-token', null, 4, true), { wrapper: createWrapper() });

    expect(fetchCompletedGames).not.toHaveBeenCalled();
  });

  it('does not fetch when token is null', () => {
    renderHook(() => useCompletedGames(null, 2025, 4, true), { wrapper: createWrapper() });

    expect(fetchCompletedGames).not.toHaveBeenCalled();
  });

  it('does not fetch when week is null', () => {
    renderHook(() => useCompletedGames('test-token', 2025, null, true), { wrapper: createWrapper() });

    expect(fetchCompletedGames).not.toHaveBeenCalled();
  });

  it('fetches completed games when enabled with a token, season, and week', async () => {
    vi.mocked(fetchCompletedGames).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useCompletedGames('test-token', 2025, 4, true), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchCompletedGames).toHaveBeenCalledWith('test-token', 2025, 4);
    expect(result.current.data).toEqual(mockResponse);
  });
});
