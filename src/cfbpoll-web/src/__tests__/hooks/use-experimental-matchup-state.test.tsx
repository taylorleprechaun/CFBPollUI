import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useExperimentalMatchupState } from '../../hooks/use-experimental-matchup-state';

const mockCalculateMutateAsync = vi.fn();

vi.mock('../../hooks/use-experimental-mutations', () => ({
  useCalculateExperimentalMatchup: () => ({
    mutateAsync: mockCalculateMutateAsync,
  }),
}));

const matchup = { awayTeam: 'Notre Dame', homeTeam: 'Florida', neutralSite: true };

function createResponse(algorithmVersion: string) {
  return { actualGames: [], algorithmVersion, prediction: null };
}

describe('useExperimentalMatchupState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls the mutation once per selected version with the matchup', async () => {
    mockCalculateMutateAsync.mockImplementation(({ algorithmVersion }: { algorithmVersion: string }) =>
      Promise.resolve(createResponse(algorithmVersion))
    );

    const { result } = renderHook(() =>
      useExperimentalMatchupState({ selectedSeason: 2024, selectedWeek: 5, token: 'test-token' })
    );

    await act(async () => {
      await result.current.handleRun(['V1', 'V2'], matchup);
    });

    expect(mockCalculateMutateAsync).toHaveBeenCalledTimes(2);
    expect(mockCalculateMutateAsync).toHaveBeenCalledWith({ algorithmVersion: 'V1', matchup, season: 2024, week: 5 });
    expect(mockCalculateMutateAsync).toHaveBeenCalledWith({ algorithmVersion: 'V2', matchup, season: 2024, week: 5 });
    expect(result.current.runState.V1.status).toBe('success');
    expect(result.current.runState.V2.status).toBe('success');
  });

  it('clears results from versions that are not part of a new run', async () => {
    mockCalculateMutateAsync.mockImplementation(({ algorithmVersion }: { algorithmVersion: string }) =>
      Promise.resolve(createResponse(algorithmVersion))
    );

    const { result } = renderHook(() =>
      useExperimentalMatchupState({ selectedSeason: 2024, selectedWeek: 5, token: 'test-token' })
    );

    await act(async () => {
      await result.current.handleRun(['V1', 'V2'], matchup);
    });
    await act(async () => {
      await result.current.handleRun(['V2'], { ...matchup, homeTeam: 'Ohio State' });
    });

    expect(result.current.runState.V1.status).toBe('idle');
    expect(result.current.runState.V1.result).toBeNull();
    expect(result.current.runState.V2.status).toBe('success');
  });

  it('does not call the mutation when a team is missing', async () => {
    const { result } = renderHook(() =>
      useExperimentalMatchupState({ selectedSeason: 2024, selectedWeek: 5, token: 'test-token' })
    );

    await act(async () => {
      await result.current.handleRun(['V1'], { ...matchup, homeTeam: '' });
    });

    expect(mockCalculateMutateAsync).not.toHaveBeenCalled();
  });

  it('does not call the mutation when both sides are the same team', async () => {
    const { result } = renderHook(() =>
      useExperimentalMatchupState({ selectedSeason: 2024, selectedWeek: 5, token: 'test-token' })
    );

    await act(async () => {
      await result.current.handleRun(['V1'], { ...matchup, awayTeam: 'Florida' });
    });

    expect(mockCalculateMutateAsync).not.toHaveBeenCalled();
    expect(result.current.submittedMatchup).toBeNull();
  });

  it('does not call the mutation when no versions are selected', async () => {
    const { result } = renderHook(() =>
      useExperimentalMatchupState({ selectedSeason: 2024, selectedWeek: 5, token: 'test-token' })
    );

    await act(async () => {
      await result.current.handleRun([], matchup);
    });

    expect(mockCalculateMutateAsync).not.toHaveBeenCalled();
  });

  it('does not call the mutation when season is null', async () => {
    const { result } = renderHook(() =>
      useExperimentalMatchupState({ selectedSeason: null, selectedWeek: 5, token: 'test-token' })
    );

    await act(async () => {
      await result.current.handleRun(['V1'], matchup);
    });

    expect(mockCalculateMutateAsync).not.toHaveBeenCalled();
  });

  it('marks a version as error and keeps the other version successful on partial failure', async () => {
    mockCalculateMutateAsync.mockImplementation(({ algorithmVersion }: { algorithmVersion: string }) =>
      algorithmVersion === 'V1' ? Promise.resolve(createResponse('V1')) : Promise.reject(new Error('V2 boom'))
    );

    const { result } = renderHook(() =>
      useExperimentalMatchupState({ selectedSeason: 2024, selectedWeek: 5, token: 'test-token' })
    );

    await act(async () => {
      await result.current.handleRun(['V1', 'V2'], matchup);
    });

    expect(result.current.runState.V1.status).toBe('success');
    expect(result.current.runState.V2.status).toBe('error');
    expect(result.current.runState.V2.error?.message).toBe('V2 boom');
  });

  it('records the submitted matchup with its season and week', async () => {
    mockCalculateMutateAsync.mockResolvedValue(createResponse('V1'));

    const { result } = renderHook(() =>
      useExperimentalMatchupState({ selectedSeason: 2024, selectedWeek: 5, token: 'test-token' })
    );

    await act(async () => {
      await result.current.handleRun(['V1'], matchup);
    });

    expect(result.current.submittedMatchup).toEqual({ ...matchup, season: 2024, week: 5 });
  });

  it('reflects pending status as isRunning while a run is in flight', async () => {
    let resolveCalculate: (value: unknown) => void = () => {};
    mockCalculateMutateAsync.mockReturnValue(new Promise((resolve) => { resolveCalculate = resolve; }));

    const { result } = renderHook(() =>
      useExperimentalMatchupState({ selectedSeason: 2024, selectedWeek: 5, token: 'test-token' })
    );

    let runPromise!: Promise<void>;
    act(() => {
      runPromise = result.current.handleRun(['V1'], matchup);
    });

    expect(result.current.isRunning).toBe(true);

    await act(async () => {
      resolveCalculate(createResponse('V1'));
      await runPromise;
    });

    expect(result.current.isRunning).toBe(false);
  });
});
