import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { UseMutationResult } from '@tanstack/react-query';
import { usePredictionsGradingState } from '../../hooks/use-predictions-grading-state';
import type { GradePredictionsResponse } from '../../schemas/admin';

function fakeMutation<TData, TVariables>(overrides: Partial<UseMutationResult<TData, Error, TVariables>> = {}) {
  return {
    isPending: false,
    mutateAsync: vi.fn(),
    ...overrides,
  } as unknown as UseMutationResult<TData, Error, TVariables>;
}

function baseOptions() {
  return {
    gradeMutation: fakeMutation<GradePredictionsResponse, { season: number; week: number }>(),
    publishResultsMutation: fakeMutation<void, { season: number; week: number }>(),
  };
}

const gradeResult: GradePredictionsResponse = {
  isPersisted: true,
  predictions: { predictions: [], resultsPublished: true, season: 2024, week: 5 },
  unmatchedGameCount: 0,
};

describe('usePredictionsGradingState', () => {
  it('gradedResult is null initially', () => {
    const { result } = renderHook(() => usePredictionsGradingState(baseOptions()));

    expect(result.current.gradedResult).toBeNull();
  });

  it('isGrading reflects gradeMutation.isPending', () => {
    const options = {
      ...baseOptions(),
      gradeMutation: fakeMutation<GradePredictionsResponse, { season: number; week: number }>({ isPending: true }),
    };

    const { result } = renderHook(() => usePredictionsGradingState(options));

    expect(result.current.isGrading).toBe(true);
  });

  it('isPublishingResults reflects publishResultsMutation.isPending', () => {
    const options = {
      ...baseOptions(),
      publishResultsMutation: fakeMutation<void, { season: number; week: number }>({ isPending: true }),
    };

    const { result } = renderHook(() => usePredictionsGradingState(options));

    expect(result.current.isPublishingResults).toBe(true);
  });

  it('handleGrade calls gradeMutation and stores the result with success feedback', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(gradeResult);
    const options = {
      ...baseOptions(),
      gradeMutation: fakeMutation<GradePredictionsResponse, { season: number; week: number }>({ mutateAsync }),
    };

    const { result } = renderHook(() => usePredictionsGradingState(options));

    await act(async () => {
      await result.current.handleGrade(2024, 5);
    });

    expect(mutateAsync).toHaveBeenCalledWith({ season: 2024, week: 5 });
    expect(result.current.gradedResult).toEqual(gradeResult);
    expect(result.current.actionFeedback).toEqual({ key: 'grade-2024-5', type: 'success' });
  });

  it('handleGrade sets error feedback on failure and does not set gradedResult', async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new Error('Grading failed'));
    const options = {
      ...baseOptions(),
      gradeMutation: fakeMutation<GradePredictionsResponse, { season: number; week: number }>({ mutateAsync }),
    };

    const { result } = renderHook(() => usePredictionsGradingState(options));

    await act(async () => {
      await result.current.handleGrade(2024, 5);
    });

    expect(result.current.gradedResult).toBeNull();
    expect(result.current.actionFeedback).toEqual({
      key: 'grade-2024-5',
      type: 'error',
      message: 'Grading failed',
    });
  });

  it('handlePublishResults calls publishResultsMutation with success feedback', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined);
    const options = {
      ...baseOptions(),
      publishResultsMutation: fakeMutation<void, { season: number; week: number }>({ mutateAsync }),
    };

    const { result } = renderHook(() => usePredictionsGradingState(options));

    await act(async () => {
      await result.current.handlePublishResults(2024, 5);
    });

    expect(mutateAsync).toHaveBeenCalledWith({ season: 2024, week: 5 });
    expect(result.current.actionFeedback).toEqual({ key: 'publish-results-2024-5', type: 'success' });
  });

  it('handlePublishResults sets error feedback on failure', async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new Error('Publish failed'));
    const options = {
      ...baseOptions(),
      publishResultsMutation: fakeMutation<void, { season: number; week: number }>({ mutateAsync }),
    };

    const { result } = renderHook(() => usePredictionsGradingState(options));

    await act(async () => {
      await result.current.handlePublishResults(2024, 5);
    });

    expect(result.current.actionFeedback).toEqual({
      key: 'publish-results-2024-5',
      type: 'error',
      message: 'Publish failed',
    });
  });

  it('clearFeedback resets actionFeedback to null', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(gradeResult);
    const options = {
      ...baseOptions(),
      gradeMutation: fakeMutation<GradePredictionsResponse, { season: number; week: number }>({ mutateAsync }),
    };

    const { result } = renderHook(() => usePredictionsGradingState(options));

    await act(async () => {
      await result.current.handleGrade(2024, 5);
    });
    expect(result.current.actionFeedback).not.toBeNull();

    act(() => {
      result.current.clearFeedback();
    });

    expect(result.current.actionFeedback).toBeNull();
  });

  it('clearGradedResult resets gradedResult to null', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(gradeResult);
    const options = {
      ...baseOptions(),
      gradeMutation: fakeMutation<GradePredictionsResponse, { season: number; week: number }>({ mutateAsync }),
    };

    const { result } = renderHook(() => usePredictionsGradingState(options));

    await act(async () => {
      await result.current.handleGrade(2024, 5);
    });
    expect(result.current.gradedResult).toEqual(gradeResult);

    act(() => {
      result.current.clearGradedResult();
    });

    expect(result.current.gradedResult).toBeNull();
  });
});
