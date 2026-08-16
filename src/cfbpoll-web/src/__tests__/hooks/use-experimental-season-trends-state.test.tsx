import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useExperimentalSeasonTrendsState } from '../../hooks/use-experimental-season-trends-state';

const mockCalculateMutateAsync = vi.fn();
let mockCalculateIsPending = false;

vi.mock('../../hooks/use-experimental-mutations', () => ({
  useCalculateExperimentalSeasonTrends: () => ({
    mutateAsync: mockCalculateMutateAsync,
    isPending: mockCalculateIsPending,
  }),
}));

describe('useExperimentalSeasonTrendsState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCalculateIsPending = false;
  });

  it('does not call calculateExperimentalSeasonTrends when season is null', async () => {
    const { result } = renderHook(() =>
      useExperimentalSeasonTrendsState({ algorithmVersion: 'V1', selectedSeason: null, token: 'test-token' })
    );

    await act(async () => {
      await result.current.handleCalculate();
    });

    expect(mockCalculateMutateAsync).not.toHaveBeenCalled();
  });

  it('reflects calculate mutation pending state', () => {
    mockCalculateIsPending = true;
    const { result } = renderHook(() =>
      useExperimentalSeasonTrendsState({ algorithmVersion: 'V1', selectedSeason: 2024, token: 'test-token' })
    );

    expect(result.current.isCalculating).toBe(true);
  });

  it('sets error and clears result on calculate failure', async () => {
    mockCalculateMutateAsync.mockRejectedValue(new Error('Season trend calculation failed'));

    const { result } = renderHook(() =>
      useExperimentalSeasonTrendsState({ algorithmVersion: 'V1', selectedSeason: 2024, token: 'test-token' })
    );

    await act(async () => {
      await result.current.handleCalculate();
    });

    expect(result.current.error?.message).toBe('Season trend calculation failed');
    expect(result.current.result).toBeNull();
  });

  it('sets result on successful calculate', async () => {
    const mockResult = { season: 2024, teams: [], weeks: [] };
    mockCalculateMutateAsync.mockResolvedValue(mockResult);

    const { result } = renderHook(() =>
      useExperimentalSeasonTrendsState({ algorithmVersion: 'V2', selectedSeason: 2024, token: 'test-token' })
    );

    await act(async () => {
      await result.current.handleCalculate();
    });

    expect(mockCalculateMutateAsync).toHaveBeenCalledWith({ algorithmVersion: 'V2', season: 2024 });
    expect(result.current.result).toEqual(mockResult);
  });
});
