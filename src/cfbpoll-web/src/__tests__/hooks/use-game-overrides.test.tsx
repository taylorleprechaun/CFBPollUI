import type { ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useGameOverrides } from '../../hooks/use-game-overrides';

vi.mock('../../services/admin-api', () => ({
  deleteGameOverride: vi.fn(),
  fetchGameOverrides: vi.fn(),
  saveGameOverride: vi.fn(),
}));

import { deleteGameOverride, fetchGameOverrides, saveGameOverride } from '../../services/admin-api';

function createWrapper(
  queryClient: QueryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const mockOverride = {
  awayTeam: 'Texas',
  createdAt: '2025-09-20T00:00:00Z',
  gameID: 401234562,
  homeTeam: 'Oklahoma',
  modifiedAt: '2025-09-20T00:00:00Z',
  originalAwayPoints: 20,
  originalHomePoints: 24,
  overrideAwayPoints: 24,
  overrideHomePoints: 20,
  reason: 'A targeting call was missed on the game-deciding play.',
  season: 2025,
  seasonType: 'regular',
  week: 4,
};

describe('useGameOverrides', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('deleteOverride() calls deleteGameOverride with the given gameId and refetches the list', async () => {
    vi.mocked(fetchGameOverrides).mockResolvedValue([mockOverride]);
    vi.mocked(deleteGameOverride).mockResolvedValue(undefined);

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useGameOverrides('test-token', 2025), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    await act(async () => {
      await result.current.deleteOverride(401234562);
    });

    expect(deleteGameOverride).toHaveBeenCalledWith('test-token', 401234562);
    expect(fetchGameOverrides).toHaveBeenCalledTimes(2);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['completed-games'] });
  });

  it('deleteOverride() rejects when there is no token', async () => {
    const { result } = renderHook(() => useGameOverrides(null, 2025), {
      wrapper: createWrapper(),
    });

    await expect(result.current.deleteOverride(401234562)).rejects.toThrow('Authentication required');
    expect(deleteGameOverride).not.toHaveBeenCalled();
  });

  it('does not fetch when season is null', () => {
    renderHook(() => useGameOverrides('test-token', null), { wrapper: createWrapper() });

    expect(fetchGameOverrides).not.toHaveBeenCalled();
  });

  it('does not fetch when token is null', () => {
    renderHook(() => useGameOverrides(null, 2025), { wrapper: createWrapper() });

    expect(fetchGameOverrides).not.toHaveBeenCalled();
  });

  it('fetches the override list when a token and season are present', async () => {
    vi.mocked(fetchGameOverrides).mockResolvedValue([mockOverride]);

    const { result } = renderHook(() => useGameOverrides('test-token', 2025), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchGameOverrides).toHaveBeenCalledWith('test-token', 2025);
    expect(result.current.data).toEqual([mockOverride]);
  });

  it('saveOverride() calls saveGameOverride with the given fields and refetches the list', async () => {
    vi.mocked(fetchGameOverrides).mockResolvedValue([mockOverride]);
    vi.mocked(saveGameOverride).mockResolvedValue(mockOverride);

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useGameOverrides('test-token', 2025), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    await act(async () => {
      await result.current.saveOverride({
        gameId: 401234562,
        overrideAwayPoints: 24,
        overrideHomePoints: 20,
        reason: 'A targeting call was missed on the game-deciding play.',
      });
    });

    expect(saveGameOverride).toHaveBeenCalledWith(
      'test-token',
      401234562,
      2025,
      20,
      24,
      'A targeting call was missed on the game-deciding play.'
    );
    expect(fetchGameOverrides).toHaveBeenCalledTimes(2);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['completed-games'] });
  });

  it('saveOverride() rejects when there is no token', async () => {
    const { result } = renderHook(() => useGameOverrides(null, 2025), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.saveOverride({
        gameId: 401234562,
        overrideAwayPoints: 24,
        overrideHomePoints: 20,
        reason: 'A targeting call was missed on the game-deciding play.',
      })
    ).rejects.toThrow('Authentication required');
    expect(saveGameOverride).not.toHaveBeenCalled();
  });
});
