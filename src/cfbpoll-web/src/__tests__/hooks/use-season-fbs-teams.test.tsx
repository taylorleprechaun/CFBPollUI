import type { ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSeasonFbsTeams } from '../../hooks/use-season-fbs-teams';

vi.mock('../../services/admin-api', () => ({
  fetchSeasonFbsTeams: vi.fn(),
}));

import { fetchSeasonFbsTeams } from '../../services/admin-api';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useSeasonFbsTeams', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('does not fetch when season is null', () => {
    renderHook(() => useSeasonFbsTeams('test-token', null), { wrapper: createWrapper() });

    expect(fetchSeasonFbsTeams).not.toHaveBeenCalled();
  });

  it('does not fetch when token is null', () => {
    renderHook(() => useSeasonFbsTeams(null, 2024), { wrapper: createWrapper() });

    expect(fetchSeasonFbsTeams).not.toHaveBeenCalled();
  });

  it('fetches the season team names when a token and season are present', async () => {
    vi.mocked(fetchSeasonFbsTeams).mockResolvedValue(['Michigan', 'USC']);

    const { result } = renderHook(() => useSeasonFbsTeams('test-token', 2024), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchSeasonFbsTeams).toHaveBeenCalledWith('test-token', 2024);
    expect(result.current.data).toEqual(['Michigan', 'USC']);
  });
});
