import type { ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useIncompleteGames } from '../../hooks/use-incomplete-games';

vi.mock('../../services/admin-api', () => ({
  fetchIncompleteGames: vi.fn(),
}));

import { fetchIncompleteGames } from '../../services/admin-api';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const mockResponse = {
  games: [{ awayTeam: 'Texas', homeTeam: 'Oklahoma', startDate: null, startTimeTbd: false }],
  season: 2026,
  week: 2,
};

describe('useIncompleteGames', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('does not fetch when disabled', () => {
    renderHook(() => useIncompleteGames('test-token', 2026, 2, false), { wrapper: createWrapper() });

    expect(fetchIncompleteGames).not.toHaveBeenCalled();
  });

  it('does not fetch when season is null', () => {
    renderHook(() => useIncompleteGames('test-token', null, 2, true), { wrapper: createWrapper() });

    expect(fetchIncompleteGames).not.toHaveBeenCalled();
  });

  it('does not fetch when token is null', () => {
    renderHook(() => useIncompleteGames(null, 2026, 2, true), { wrapper: createWrapper() });

    expect(fetchIncompleteGames).not.toHaveBeenCalled();
  });

  it('does not fetch when week is null', () => {
    renderHook(() => useIncompleteGames('test-token', 2026, null, true), { wrapper: createWrapper() });

    expect(fetchIncompleteGames).not.toHaveBeenCalled();
  });

  it('fetches incomplete games when enabled with a token, season, and week', async () => {
    vi.mocked(fetchIncompleteGames).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useIncompleteGames('test-token', 2026, 2, true), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchIncompleteGames).toHaveBeenCalledWith('test-token', 2026, 2);
    expect(result.current.data).toEqual(mockResponse);
  });
});
