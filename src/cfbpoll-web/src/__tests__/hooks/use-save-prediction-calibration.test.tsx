import type { ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSavePredictionCalibration } from '../../hooks/use-save-prediction-calibration';

vi.mock('../../services/admin-api', () => ({
  savePredictionCalibration: vi.fn(),
}));

import { savePredictionCalibration } from '../../services/admin-api';

const savedResponse = {
  carriedFromSeason: null,
  carriedFromWeek: null,
  draftUsesDifferentValues: true,
  isLocked: false,
  isStored: true,
  isSupported: true,
  parameters: [],
  season: 2026,
  source: 'Manual' as const,
  updatedAt: '2026-11-01T12:00:00Z',
  values: { paramA: 2 },
  week: 10,
};

function createClientAndWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

describe('useSavePredictionCalibration', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('calls savePredictionCalibration with token, season, week and values', async () => {
    vi.mocked(savePredictionCalibration).mockResolvedValue(savedResponse);
    const { wrapper } = createClientAndWrapper();

    const { result } = renderHook(() => useSavePredictionCalibration('test-token'), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ season: 2026, values: { paramA: 2 }, week: 10 });
    });

    expect(savePredictionCalibration).toHaveBeenCalledWith('test-token', 2026, 10, { paramA: 2 });
  });

  it('rejects with Authentication required when token is null', async () => {
    const { wrapper } = createClientAndWrapper();

    const { result } = renderHook(() => useSavePredictionCalibration(null), { wrapper });

    await expect(
      act(() => result.current.mutateAsync({ season: 2026, values: {}, week: 10 }))
    ).rejects.toThrow('Authentication required');
  });

  it('stores the saved calibration and invalidates the season history on success', async () => {
    vi.mocked(savePredictionCalibration).mockResolvedValue(savedResponse);
    const { queryClient, wrapper } = createClientAndWrapper();
    queryClient.setQueryData(['prediction-calibration-history', 2026], []);

    const { result } = renderHook(() => useSavePredictionCalibration('test-token'), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ season: 2026, values: { paramA: 2 }, week: 10 });
    });

    expect(queryClient.getQueryData(['prediction-calibration', 2026, 10])).toEqual(savedResponse);
    expect(queryClient.getQueryState(['prediction-calibration-history', 2026])?.isInvalidated).toBe(true);
  });
});
