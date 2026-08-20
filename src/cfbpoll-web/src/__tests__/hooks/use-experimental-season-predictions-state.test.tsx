import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useExperimentalSeasonPredictionsState } from '../../hooks/use-experimental-season-predictions-state';

const mockCalculateMutateAsync = vi.fn();

vi.mock('../../hooks/use-experimental-mutations', () => ({
  useCalculateExperimentalSeasonPredictions: () => ({
    mutateAsync: mockCalculateMutateAsync,
  }),
}));

function buildResponse(algorithmVersion: string) {
  return {
    algorithmVersion,
    overallSummary: {
      gradedGameCount: 0,
      marginBias: null,
      marginMAE: null,
      marginRMSE: null,
      overUnder: { correct: 0, incorrect: 0, push: 0 },
      spread: { correct: 0, incorrect: 0, push: 0 },
      winner: { correct: 0, incorrect: 0, push: 0 },
    },
    season: 2024,
    weeks: [],
  };
}

describe('useExperimentalSeasonPredictionsState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not call the calculate mutation when no versions are selected', async () => {
    const { result } = renderHook(() =>
      useExperimentalSeasonPredictionsState({ selectedSeason: 2024, token: 'test-token' })
    );

    await act(async () => {
      await result.current.handleRun([], [5, 6]);
    });

    expect(mockCalculateMutateAsync).not.toHaveBeenCalled();
  });

  it('does not call the calculate mutation when no weeks are selected', async () => {
    const { result } = renderHook(() =>
      useExperimentalSeasonPredictionsState({ selectedSeason: 2024, token: 'test-token' })
    );

    await act(async () => {
      await result.current.handleRun(['V1'], []);
    });

    expect(mockCalculateMutateAsync).not.toHaveBeenCalled();
  });

  it('does not call the calculate mutation when season is null', async () => {
    const { result } = renderHook(() =>
      useExperimentalSeasonPredictionsState({ selectedSeason: null, token: 'test-token' })
    );

    await act(async () => {
      await result.current.handleRun(['V1'], [5, 6]);
    });

    expect(mockCalculateMutateAsync).not.toHaveBeenCalled();
  });

  it('marks a version as error and keeps the other version successful on partial failure', async () => {
    mockCalculateMutateAsync.mockImplementation(({ algorithmVersion }: { algorithmVersion: string }) =>
      algorithmVersion === 'V1' ? Promise.resolve(buildResponse('V1')) : Promise.reject(new Error('V2 boom'))
    );

    const { result } = renderHook(() =>
      useExperimentalSeasonPredictionsState({ selectedSeason: 2024, token: 'test-token' })
    );

    await act(async () => {
      await result.current.handleRun(['V1', 'V2'], [5, 6]);
    });

    expect(result.current.runState.V1.status).toBe('success');
    expect(result.current.runState.V2.status).toBe('error');
    expect(result.current.runState.V2.error?.message).toBe('V2 boom');
  });

  it('reflects pending status as isRunning while a run is in flight', async () => {
    let resolveCalculate: (value: unknown) => void = () => {};
    mockCalculateMutateAsync.mockReturnValue(new Promise((resolve) => { resolveCalculate = resolve; }));

    const { result } = renderHook(() =>
      useExperimentalSeasonPredictionsState({ selectedSeason: 2024, token: 'test-token' })
    );

    let runPromise!: Promise<void>;
    act(() => {
      runPromise = result.current.handleRun(['V1'], [5, 6]);
    });

    expect(result.current.isRunning).toBe(true);

    await act(async () => {
      resolveCalculate(buildResponse('V1'));
      await runPromise;
    });

    expect(result.current.isRunning).toBe(false);
  });

  it('resets every entry back to idle', async () => {
    mockCalculateMutateAsync.mockResolvedValue(buildResponse('V1'));

    const { result } = renderHook(() =>
      useExperimentalSeasonPredictionsState({ selectedSeason: 2024, token: 'test-token' })
    );

    await act(async () => {
      await result.current.handleRun(['V1'], [5, 6]);
    });
    expect(result.current.runState.V1.status).toBe('success');

    act(() => {
      result.current.reset();
    });

    expect(result.current.runState.V1.status).toBe('idle');
  });

  it('sets every selected version to success on a successful run', async () => {
    mockCalculateMutateAsync.mockImplementation(({ algorithmVersion }: { algorithmVersion: string }) =>
      Promise.resolve(buildResponse(algorithmVersion))
    );

    const { result } = renderHook(() =>
      useExperimentalSeasonPredictionsState({ selectedSeason: 2024, token: 'test-token' })
    );

    await act(async () => {
      await result.current.handleRun(['V1', 'V2'], [5, 6]);
    });

    expect(mockCalculateMutateAsync).toHaveBeenCalledWith({ algorithmVersion: 'V1', season: 2024, weeks: [5, 6] });
    expect(mockCalculateMutateAsync).toHaveBeenCalledWith({ algorithmVersion: 'V2', season: 2024, weeks: [5, 6] });
    expect(result.current.runState.V1.status).toBe('success');
    expect(result.current.runState.V2.status).toBe('success');
  });
});
