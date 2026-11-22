import type { ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useNewPredictionGames } from '../../hooks/use-new-prediction-games';

vi.mock('../../services/admin-api', () => ({
  fetchNewPredictionGames: vi.fn(),
}));

import { fetchNewPredictionGames } from '../../services/admin-api';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useNewPredictionGames', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('does not fetch when token is null', () => {
    renderHook(() => useNewPredictionGames(null, 2026, 15), { wrapper: createWrapper() });

    expect(fetchNewPredictionGames).not.toHaveBeenCalled();
  });

  it('fetches the preview for the season and week', async () => {
    const preview = { games: [], waitingOnLines: [{ awayTeam: 'Team C', homeTeam: 'Team D', startDate: null }] };
    vi.mocked(fetchNewPredictionGames).mockResolvedValue(preview);

    const { result } = renderHook(() => useNewPredictionGames('test-token', 2026, 15), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchNewPredictionGames).toHaveBeenCalledWith('test-token', 2026, 15);
    expect(result.current.data).toEqual(preview);
  });
});
