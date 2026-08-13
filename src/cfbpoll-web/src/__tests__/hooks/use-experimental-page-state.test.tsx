import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useExperimentalPageState } from '../../hooks/use-experimental-page-state';

const mockCalculateMutateAsync = vi.fn();
const mockExportMutateAsync = vi.fn();
let mockCalculateIsPending = false;
let mockExportIsPending = false;

vi.mock('../../hooks/use-experimental-mutations', () => ({
  useCalculateExperimental: () => ({
    mutateAsync: mockCalculateMutateAsync,
    isPending: mockCalculateIsPending,
  }),
  useExportExperimental: () => ({
    mutateAsync: mockExportMutateAsync,
    isPending: mockExportIsPending,
  }),
}));

describe('useExperimentalPageState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCalculateIsPending = false;
    mockExportIsPending = false;
  });

  it('calls downloadExperimentalExport with algorithm version, season, and week on export', async () => {
    mockExportMutateAsync.mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useExperimentalPageState({ algorithmVersion: 'V2', selectedSeason: 2024, selectedWeek: 5, token: 'test-token' })
    );

    await act(async () => {
      await result.current.handleExport();
    });

    expect(mockExportMutateAsync).toHaveBeenCalledWith({ algorithmVersion: 'V2', season: 2024, week: 5 });
  });

  it('does not call calculateExperimental when season is null', async () => {
    const { result } = renderHook(() =>
      useExperimentalPageState({ algorithmVersion: 'V1', selectedSeason: null, selectedWeek: 5, token: 'test-token' })
    );

    await act(async () => {
      await result.current.handleCalculate();
    });

    expect(mockCalculateMutateAsync).not.toHaveBeenCalled();
  });

  it('does not call downloadExperimentalExport when week is null', async () => {
    const { result } = renderHook(() =>
      useExperimentalPageState({ algorithmVersion: 'V1', selectedSeason: 2024, selectedWeek: null, token: 'test-token' })
    );

    await act(async () => {
      await result.current.handleExport();
    });

    expect(mockExportMutateAsync).not.toHaveBeenCalled();
  });

  it('reflects calculate mutation pending state', () => {
    mockCalculateIsPending = true;
    const { result } = renderHook(() =>
      useExperimentalPageState({ algorithmVersion: 'V1', selectedSeason: 2024, selectedWeek: 5, token: 'test-token' })
    );

    expect(result.current.isCalculating).toBe(true);
  });

  it('reflects export mutation pending state', () => {
    mockExportIsPending = true;
    const { result } = renderHook(() =>
      useExperimentalPageState({ algorithmVersion: 'V1', selectedSeason: 2024, selectedWeek: 5, token: 'test-token' })
    );

    expect(result.current.isExporting).toBe(true);
  });

  it('sets calculatedResult on successful calculate', async () => {
    const mockResult = { algorithmVersion: 'V2', rankings: { season: 2024, week: 5, rankings: [] } };
    mockCalculateMutateAsync.mockResolvedValue(mockResult);

    const { result } = renderHook(() =>
      useExperimentalPageState({ algorithmVersion: 'V2', selectedSeason: 2024, selectedWeek: 5, token: 'test-token' })
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
      useExperimentalPageState({ algorithmVersion: 'V1', selectedSeason: 2024, selectedWeek: 5, token: 'test-token' })
    );

    await act(async () => {
      await result.current.handleCalculate();
    });

    expect(result.current.error?.message).toBe('Calculation failed');
    expect(result.current.calculatedResult).toBeNull();
  });

  it('sets error on export failure', async () => {
    mockExportMutateAsync.mockRejectedValue(new Error('Export failed'));

    const { result } = renderHook(() =>
      useExperimentalPageState({ algorithmVersion: 'V1', selectedSeason: 2024, selectedWeek: 5, token: 'test-token' })
    );

    await act(async () => {
      await result.current.handleExport();
    });

    expect(result.current.error?.message).toBe('Export failed');
  });
});
