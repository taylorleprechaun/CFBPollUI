import type { UseMutationResult } from '@tanstack/react-query';

import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { GradePredictionsResponse } from '../../schemas/admin';

import { usePredictionsGradingState } from '../../hooks/use-predictions-grading-state';

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
    onGradeSuccess: vi.fn(),
    publishResultsMutation: fakeMutation<void, { season: number; week: number }>(),
  };
}

const gradeResult: GradePredictionsResponse = {
  isPersisted: true,
  predictions: { isGraded: true, predictions: [], resultsPublished: false, season: 2024, week: 5 },
  unmatchedGameCount: 0,
};

describe('usePredictionsGradingState', () => {
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

  it('handleGrade calls gradeMutation and invokes onGradeSuccess with success feedback', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(gradeResult);
    const onGradeSuccess = vi.fn();
    const options = {
      ...baseOptions(),
      gradeMutation: fakeMutation<GradePredictionsResponse, { season: number; week: number }>({ mutateAsync }),
      onGradeSuccess,
    };

    const { result } = renderHook(() => usePredictionsGradingState(options));

    await act(async () => {
      await result.current.handleGrade(2024, 5);
    });

    expect(mutateAsync).toHaveBeenCalledWith({ season: 2024, week: 5 });
    expect(onGradeSuccess).toHaveBeenCalledWith(gradeResult);
    expect(result.current.actionFeedback).toEqual({ key: 'grade-2024-5', type: 'success' });
  });

  it('handleGrade sets error feedback on failure and does not invoke onGradeSuccess', async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new Error('Grading failed'));
    const onGradeSuccess = vi.fn();
    const options = {
      ...baseOptions(),
      gradeMutation: fakeMutation<GradePredictionsResponse, { season: number; week: number }>({ mutateAsync }),
      onGradeSuccess,
    };

    const { result } = renderHook(() => usePredictionsGradingState(options));

    await act(async () => {
      await result.current.handleGrade(2024, 5);
    });

    expect(onGradeSuccess).not.toHaveBeenCalled();
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
});
