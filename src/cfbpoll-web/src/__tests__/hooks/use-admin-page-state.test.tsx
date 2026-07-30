import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { UseMutationResult } from '@tanstack/react-query';
import { useAdminPageState } from '../../hooks/use-admin-page-state';

function fakeMutation<TData, TVariables>(overrides: Partial<UseMutationResult<TData, Error, TVariables>> = {}) {
  return {
    isPending: false,
    mutateAsync: vi.fn(),
    ...overrides,
  } as unknown as UseMutationResult<TData, Error, TVariables>;
}

interface CalcResult {
  season: number;
  week: number;
}

function baseOptions() {
  return {
    calculateMutation: fakeMutation<CalcResult, { season: number; week: number }>(),
    calcErrorLabel: 'Calculation failed',
    deleteMutation: fakeMutation<void, { season: number; week: number }>(),
    getResultSeasonWeek: (r: CalcResult) => r,
    items: [],
    publishMutation: fakeMutation<void, { season: number; week: number }>(),
    queryError: null,
    queryErrorLabel: 'Failed to load',
    refetch: vi.fn(),
    selectedSeason: 2024,
    selectedWeek: 5,
  };
}

describe('useAdminPageState - refresh cache', () => {
  it('isRefreshingCache defaults to false when refreshCacheMutation is not provided', () => {
    const { result } = renderHook(() => useAdminPageState<CalcResult>(baseOptions()));

    expect(result.current.isRefreshingCache).toBe(false);
  });

  it('handleRefreshCache sets refreshCacheConfirm without calling the mutation', () => {
    const mutateAsync = vi.fn();
    const options = {
      ...baseOptions(),
      refreshCacheMutation: fakeMutation<{ removedCount: number }, { season: number; week: number }>({ mutateAsync }),
    };

    const { result } = renderHook(() => useAdminPageState<CalcResult>(options));

    act(() => {
      result.current.handleRefreshCache(2024, 5);
    });

    expect(result.current.refreshCacheConfirm).toEqual({ season: 2024, week: 5 });
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('setRefreshCacheConfirm can clear the pending confirmation', () => {
    const { result } = renderHook(() => useAdminPageState<CalcResult>(baseOptions()));

    act(() => {
      result.current.handleRefreshCache(2024, 5);
    });
    expect(result.current.refreshCacheConfirm).toEqual({ season: 2024, week: 5 });

    act(() => {
      result.current.setRefreshCacheConfirm(null);
    });
    expect(result.current.refreshCacheConfirm).toBeNull();
  });

  it('executeRefreshCache no-ops when refreshCacheMutation is not provided', async () => {
    const { result } = renderHook(() => useAdminPageState<CalcResult>(baseOptions()));

    await act(async () => {
      await result.current.executeRefreshCache(2024, 5);
    });

    expect(result.current.actionFeedback).toBeNull();
  });

  it('isRefreshingCache reflects refreshCacheMutation.isPending when provided', () => {
    const options = {
      ...baseOptions(),
      refreshCacheMutation: fakeMutation<{ removedCount: number }, { season: number; week: number }>({ isPending: true }),
    };

    const { result } = renderHook(() => useAdminPageState<CalcResult>(options));

    expect(result.current.isRefreshingCache).toBe(true);
  });

  it('executeRefreshCache sets success feedback with removed count and clears the confirmation', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ removedCount: 4 });
    const options = {
      ...baseOptions(),
      refreshCacheMutation: fakeMutation<{ removedCount: number }, { season: number; week: number }>({ mutateAsync }),
    };

    const { result } = renderHook(() => useAdminPageState<CalcResult>(options));

    act(() => {
      result.current.handleRefreshCache(2024, 5);
    });
    expect(result.current.refreshCacheConfirm).toEqual({ season: 2024, week: 5 });

    await act(async () => {
      await result.current.executeRefreshCache(2024, 5);
    });

    expect(mutateAsync).toHaveBeenCalledWith({ season: 2024, week: 5 });
    expect(result.current.refreshCacheConfirm).toBeNull();
    expect(result.current.actionFeedback).toEqual({
      key: 'refresh-cache-2024-5',
      type: 'success',
      message: 'Removed 4 cached entries',
    });
  });

  it('executeRefreshCache sets error feedback on failure', async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new Error('Server error'));
    const options = {
      ...baseOptions(),
      refreshCacheMutation: fakeMutation<{ removedCount: number }, { season: number; week: number }>({ mutateAsync }),
    };

    const { result } = renderHook(() => useAdminPageState<CalcResult>(options));

    await act(async () => {
      await result.current.executeRefreshCache(2024, 5);
    });

    expect(result.current.actionFeedback).toEqual({
      key: 'refresh-cache-2024-5',
      type: 'error',
      message: 'Server error',
    });
  });
});
