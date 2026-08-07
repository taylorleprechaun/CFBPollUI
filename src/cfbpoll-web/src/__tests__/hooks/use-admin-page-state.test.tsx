import type { UseMutationResult } from '@tanstack/react-query';

import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useAdminPageState } from '../../hooks/use-admin-page-state';

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

interface CalcResult {
  season: number;
  week: number;
}

function fakeMutation<TData, TVariables>(overrides: Partial<UseMutationResult<TData, Error, TVariables>> = {}) {
  return {
    isPending: false,
    mutateAsync: vi.fn(),
    ...overrides,
  } as unknown as UseMutationResult<TData, Error, TVariables>;
}

describe('useAdminPageState - delete', () => {
  it('executeDelete calls onDeleteSuccess with the deleted season and week', async () => {
    const onDeleteSuccess = vi.fn();
    const mutateAsync = vi.fn().mockResolvedValue(undefined);
    const options = {
      ...baseOptions(),
      deleteMutation: fakeMutation<void, { season: number; week: number }>({ mutateAsync }),
      onDeleteSuccess,
    };

    const { result } = renderHook(() => useAdminPageState<CalcResult>(options));

    await act(async () => {
      await result.current.executeDelete(2024, 5);
    });

    expect(onDeleteSuccess).toHaveBeenCalledWith(2024, 5);
  });

  it('executeDelete does not call onDeleteSuccess when the delete fails', async () => {
    const onDeleteSuccess = vi.fn();
    const mutateAsync = vi.fn().mockRejectedValue(new Error('Delete failed'));
    const options = {
      ...baseOptions(),
      deleteMutation: fakeMutation<void, { season: number; week: number }>({ mutateAsync }),
      onDeleteSuccess,
    };

    const { result } = renderHook(() => useAdminPageState<CalcResult>(options));

    await act(async () => {
      await result.current.executeDelete(2024, 5);
    });

    expect(onDeleteSuccess).not.toHaveBeenCalled();
  });

  it('executeDelete does not throw when onDeleteSuccess is not provided', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined);
    const options = {
      ...baseOptions(),
      deleteMutation: fakeMutation<void, { season: number; week: number }>({ mutateAsync }),
    };

    const { result } = renderHook(() => useAdminPageState<CalcResult>(options));

    await expect(
      act(async () => {
        await result.current.executeDelete(2024, 5);
      })
    ).resolves.not.toThrow();
  });
});

describe('useAdminPageState - publish', () => {
  it('handlePublish calls publishMutation.mutateAsync and sets success feedback', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined);
    const options = {
      ...baseOptions(),
      publishMutation: fakeMutation<void, { season: number; week: number }>({ mutateAsync }),
    };

    const { result } = renderHook(() => useAdminPageState<CalcResult>(options));

    await act(async () => {
      await result.current.handlePublish(2024, 5, 'active-view-publish');
    });

    expect(mutateAsync).toHaveBeenCalledWith({ season: 2024, week: 5 });
    expect(result.current.actionFeedback).toEqual({ key: 'active-view-publish-2024-5', type: 'success' });
  });

  it('handlePublish sets error feedback on failure', async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new Error('Publish failed'));
    const options = {
      ...baseOptions(),
      publishMutation: fakeMutation<void, { season: number; week: number }>({ mutateAsync }),
    };

    const { result } = renderHook(() => useAdminPageState<CalcResult>(options));

    await act(async () => {
      await result.current.handlePublish(2024, 5, 'active-view-publish');
    });

    expect(result.current.actionFeedback).toEqual({
      key: 'active-view-publish-2024-5',
      type: 'error',
      message: 'Publish failed',
    });
  });
});

describe('useAdminPageState - refresh cache', () => {
  it('executeRefreshCache no-ops when refreshCacheMutation is not provided', async () => {
    const { result } = renderHook(() => useAdminPageState<CalcResult>(baseOptions()));

    await act(async () => {
      await result.current.executeRefreshCache(2024, 5);
    });

    expect(result.current.actionFeedback).toBeNull();
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

  it('isRefreshingCache defaults to false when refreshCacheMutation is not provided', () => {
    const { result } = renderHook(() => useAdminPageState<CalcResult>(baseOptions()));

    expect(result.current.isRefreshingCache).toBe(false);
  });

  it('isRefreshingCache reflects refreshCacheMutation.isPending when provided', () => {
    const options = {
      ...baseOptions(),
      refreshCacheMutation: fakeMutation<{ removedCount: number }, { season: number; week: number }>({ isPending: true }),
    };

    const { result } = renderHook(() => useAdminPageState<CalcResult>(options));

    expect(result.current.isRefreshingCache).toBe(true);
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
});

describe('useAdminPageState - season collapse tracking', () => {
  it('collapses every season present in items on first load', () => {
    const options = { ...baseOptions(), items: [{ season: 2024 }, { season: 2023 }] };

    const { result } = renderHook(() => useAdminPageState<CalcResult>(options));

    expect(result.current.collapsedSeasons).toEqual(new Set([2024, 2023]));
  });

  it('does not re-collapse a season the admin has expanded when a brand-new season appears', () => {
    const initialItems = [{ season: 2024 }, { season: 2023 }];

    const { result, rerender } = renderHook(
      (items: { season: number }[]) => useAdminPageState<CalcResult>({ ...baseOptions(), items }),
      { initialProps: initialItems }
    );

    expect(result.current.collapsedSeasons).toEqual(new Set([2024, 2023]));

    act(() => {
      result.current.toggleSeason(2024);
    });
    expect(result.current.collapsedSeasons).toEqual(new Set([2023]));

    rerender([{ season: 2025 }, { season: 2024 }, { season: 2023 }]);

    expect(result.current.collapsedSeasons).toEqual(new Set([2023, 2025]));
  });
});
