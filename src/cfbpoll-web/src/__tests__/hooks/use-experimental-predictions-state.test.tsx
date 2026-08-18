import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useExperimentalPredictionsState } from '../../hooks/use-experimental-predictions-state';

const mockCalculateMutateAsync = vi.fn();
let mockCalculateIsPending = false;

vi.mock('../../hooks/use-experimental-mutations', () => ({
  useCalculateExperimentalPredictions: () => ({
    mutateAsync: mockCalculateMutateAsync,
    isPending: mockCalculateIsPending,
  }),
}));

describe('useExperimentalPredictionsState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCalculateIsPending = false;
  });

  it('does not call calculateExperimentalPredictions when season is null', async () => {
    const { result } = renderHook(() =>
      useExperimentalPredictionsState({ algorithmVersion: 'V1', selectedSeason: null, selectedWeek: 5, token: 'test-token' })
    );

    await act(async () => {
      await result.current.handleCalculate();
    });

    expect(mockCalculateMutateAsync).not.toHaveBeenCalled();
  });

  it('does not call calculateExperimentalPredictions when week is null', async () => {
    const { result } = renderHook(() =>
      useExperimentalPredictionsState({ algorithmVersion: 'V1', selectedSeason: 2024, selectedWeek: null, token: 'test-token' })
    );

    await act(async () => {
      await result.current.handleCalculate();
    });

    expect(mockCalculateMutateAsync).not.toHaveBeenCalled();
  });

  it('reflects calculate mutation pending state', () => {
    mockCalculateIsPending = true;
    const { result } = renderHook(() =>
      useExperimentalPredictionsState({ algorithmVersion: 'V1', selectedSeason: 2024, selectedWeek: 5, token: 'test-token' })
    );

    expect(result.current.isCalculating).toBe(true);
  });

  it('sets calculatedResult on successful calculate', async () => {
    const mockResult = {
      algorithmVersion: 'V2',
      predictions: [],
      summary: {
        gradedGameCount: 0,
        marginBias: null,
        marginMAE: null,
        marginRMSE: null,
        overUnder: { correct: 0, incorrect: 0, push: 0 },
        spread: { correct: 0, incorrect: 0, push: 0 },
        winner: { correct: 0, incorrect: 0, push: 0 },
      },
    };
    mockCalculateMutateAsync.mockResolvedValue(mockResult);

    const { result } = renderHook(() =>
      useExperimentalPredictionsState({ algorithmVersion: 'V2', selectedSeason: 2024, selectedWeek: 5, token: 'test-token' })
    );

    await act(async () => {
      await result.current.handleCalculate();
    });

    expect(mockCalculateMutateAsync).toHaveBeenCalledWith({ algorithmVersion: 'V2', season: 2024, week: 5 });
    expect(result.current.calculatedResult).toEqual(mockResult);
  });

  it('sets error and clears calculatedResult on calculate failure', async () => {
    mockCalculateMutateAsync.mockRejectedValue(new Error('Calculation failed'));

    const { result } = renderHook(() =>
      useExperimentalPredictionsState({ algorithmVersion: 'V1', selectedSeason: 2024, selectedWeek: 5, token: 'test-token' })
    );

    await act(async () => {
      await result.current.handleCalculate();
    });

    expect(result.current.error?.message).toBe('Calculation failed');
    expect(result.current.calculatedResult).toBeNull();
  });
});
