import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useExperimentalPageState } from '../../hooks/use-experimental-page-state';

const mockCalculateMutateAsync = vi.fn();

vi.mock('../../hooks/use-experimental-mutations', () => ({
  useCalculateExperimental: () => ({
    mutateAsync: mockCalculateMutateAsync,
  }),
}));

describe('useExperimentalPageState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not call the calculate mutation when no versions are selected', async () => {
    const { result } = renderHook(() =>
      useExperimentalPageState({ selectedSeason: 2024, selectedWeek: 5, token: 'test-token' })
    );

    await act(async () => {
      await result.current.handleRun([]);
    });

    expect(mockCalculateMutateAsync).not.toHaveBeenCalled();
  });

  it('does not call the calculate mutation when season is null', async () => {
    const { result } = renderHook(() =>
      useExperimentalPageState({ selectedSeason: null, selectedWeek: 5, token: 'test-token' })
    );

    await act(async () => {
      await result.current.handleRun(['V1']);
    });

    expect(mockCalculateMutateAsync).not.toHaveBeenCalled();
  });

  it('does not call the calculate mutation when week is null', async () => {
    const { result } = renderHook(() =>
      useExperimentalPageState({ selectedSeason: 2024, selectedWeek: null, token: 'test-token' })
    );

    await act(async () => {
      await result.current.handleRun(['V1']);
    });

    expect(mockCalculateMutateAsync).not.toHaveBeenCalled();
  });

  it('marks a version as error and keeps the other version successful on partial failure', async () => {
    mockCalculateMutateAsync.mockImplementation(({ algorithmVersion }: { algorithmVersion: string }) =>
      algorithmVersion === 'V1'
        ? Promise.resolve({ algorithmVersion: 'V1', rankings: { season: 2024, week: 5, rankings: [] } })
        : Promise.reject(new Error('V2 boom'))
    );

    const { result } = renderHook(() =>
      useExperimentalPageState({ selectedSeason: 2024, selectedWeek: 5, token: 'test-token' })
    );

    await act(async () => {
      await result.current.handleRun(['V1', 'V2']);
    });

    expect(result.current.runState.V1.status).toBe('success');
    expect(result.current.runState.V2.status).toBe('error');
    expect(result.current.runState.V2.error?.message).toBe('V2 boom');
  });

  it('reflects pending status as isRunning while a run is in flight', async () => {
    let resolveCalculate: (value: unknown) => void = () => {};
    mockCalculateMutateAsync.mockReturnValue(new Promise((resolve) => { resolveCalculate = resolve; }));

    const { result } = renderHook(() =>
      useExperimentalPageState({ selectedSeason: 2024, selectedWeek: 5, token: 'test-token' })
    );

    let runPromise!: Promise<void>;
    act(() => {
      runPromise = result.current.handleRun(['V1']);
    });

    expect(result.current.isRunning).toBe(true);

    await act(async () => {
      resolveCalculate({ algorithmVersion: 'V1', rankings: { season: 2024, week: 5, rankings: [] } });
      await runPromise;
    });

    expect(result.current.isRunning).toBe(false);
  });

  it('resets every entry back to idle', async () => {
    mockCalculateMutateAsync.mockResolvedValue({ algorithmVersion: 'V1', rankings: { season: 2024, week: 5, rankings: [] } });

    const { result } = renderHook(() =>
      useExperimentalPageState({ selectedSeason: 2024, selectedWeek: 5, token: 'test-token' })
    );

    await act(async () => {
      await result.current.handleRun(['V1']);
    });
    expect(result.current.runState.V1.status).toBe('success');

    act(() => {
      result.current.reset();
    });

    expect(result.current.runState.V1.status).toBe('idle');
  });

  it('sets every selected version to success on a successful run', async () => {
    mockCalculateMutateAsync.mockImplementation(({ algorithmVersion }: { algorithmVersion: string }) =>
      Promise.resolve({ algorithmVersion, rankings: { season: 2024, week: 5, rankings: [] } })
    );

    const { result } = renderHook(() =>
      useExperimentalPageState({ selectedSeason: 2024, selectedWeek: 5, token: 'test-token' })
    );

    await act(async () => {
      await result.current.handleRun(['V1', 'V2']);
    });

    expect(mockCalculateMutateAsync).toHaveBeenCalledWith({ algorithmVersion: 'V1', season: 2024, week: 5 });
    expect(mockCalculateMutateAsync).toHaveBeenCalledWith({ algorithmVersion: 'V2', season: 2024, week: 5 });
    expect(result.current.runState.V1.status).toBe('success');
    expect(result.current.runState.V2.status).toBe('success');
  });
});
