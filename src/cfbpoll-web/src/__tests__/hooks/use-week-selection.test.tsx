import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { Week } from '../../types';

import { useWeekSelection } from '../../hooks/use-week-selection';

describe('useWeekSelection', () => {
  it('auto-selects last week when weeks are available', () => {
    const weeks: Week[] = [
      { weekNumber: 1, label: 'Week 1', isComplete: true, predictionsPublished: false, rankingsPublished: true },
      { weekNumber: 5, label: 'Week 5', isComplete: true, predictionsPublished: false, rankingsPublished: false },
    ];

    const { result } = renderHook(() => useWeekSelection(weeks));

    expect(result.current.selectedWeek).toBe(5);
  });

  it('auto-selects the highest complete week with the latest-complete strategy', () => {
    const weeks: Week[] = [
      { weekNumber: 4, label: 'Week 5', isComplete: true, predictionsPublished: false, rankingsPublished: true },
      { weekNumber: 5, label: 'Week 6', isComplete: true, predictionsPublished: false, rankingsPublished: false },
      { weekNumber: 6, label: 'Week 7', isComplete: false, predictionsPublished: false, rankingsPublished: false },
      { weekNumber: 15, label: 'Week 16', isComplete: false, predictionsPublished: false, rankingsPublished: false },
    ];

    const { result } = renderHook(() => useWeekSelection(weeks, 'latest-complete'));

    expect(result.current.selectedWeek).toBe(5);
  });

  it('auto-selects the highest week number even when weeks arrive out of order', () => {
    const weeks: Week[] = [
      { weekNumber: 5, label: 'Week 5', isComplete: true, predictionsPublished: false, rankingsPublished: false },
      { weekNumber: 1, label: 'Week 1', isComplete: true, predictionsPublished: false, rankingsPublished: true },
      { weekNumber: 3, label: 'Week 3', isComplete: true, predictionsPublished: false, rankingsPublished: true },
    ];

    const { result } = renderHook(() => useWeekSelection(weeks));

    expect(result.current.selectedWeek).toBe(5);
  });

  it('auto-selects when reset to null', () => {
    const weeks: Week[] = [
      { weekNumber: 1, label: 'Week 1', isComplete: true, predictionsPublished: false, rankingsPublished: true },
      { weekNumber: 5, label: 'Week 5', isComplete: true, predictionsPublished: false, rankingsPublished: false },
    ];

    const { result } = renderHook(() => useWeekSelection(weeks));

    act(() => {
      result.current.setSelectedWeek(null);
    });

    expect(result.current.selectedWeek).toBe(5);
  });

  it('auto-selects when weeks data arrives later', () => {
    const weeks: Week[] = [
      { weekNumber: 1, label: 'Week 1', isComplete: true, predictionsPublished: false, rankingsPublished: true },
      { weekNumber: 3, label: 'Week 3', isComplete: true, predictionsPublished: false, rankingsPublished: true },
    ];

    const { result, rerender } = renderHook(
      ({ w }: { w: Week[] | undefined }) => useWeekSelection(w),
      { initialProps: { w: undefined as Week[] | undefined } }
    );

    expect(result.current.selectedWeek).toBeNull();

    rerender({ w: weeks });

    expect(result.current.selectedWeek).toBe(3);
  });

  it('falls back to the lowest week when no week is complete with the latest-complete strategy', () => {
    const weeks: Week[] = [
      { weekNumber: 2, label: 'Week 3', isComplete: false, predictionsPublished: false, rankingsPublished: false },
      { weekNumber: 1, label: 'Week 2', isComplete: false, predictionsPublished: false, rankingsPublished: false },
      { weekNumber: 15, label: 'Week 16', isComplete: false, predictionsPublished: false, rankingsPublished: false },
    ];

    const { result } = renderHook(() => useWeekSelection(weeks, 'latest-complete'));

    expect(result.current.selectedWeek).toBe(1);
  });

  it('preserves manual selection', () => {
    const weeks: Week[] = [
      { weekNumber: 1, label: 'Week 1', isComplete: true, predictionsPublished: false, rankingsPublished: true },
      { weekNumber: 5, label: 'Week 5', isComplete: true, predictionsPublished: false, rankingsPublished: false },
    ];

    const { result } = renderHook(() => useWeekSelection(weeks));

    act(() => {
      result.current.setSelectedWeek(1);
    });

    expect(result.current.selectedWeek).toBe(1);
  });

  it('preserves manual selection with the latest-complete strategy', () => {
    const weeks: Week[] = [
      { weekNumber: 5, label: 'Week 6', isComplete: true, predictionsPublished: false, rankingsPublished: false },
      { weekNumber: 6, label: 'Week 7', isComplete: false, predictionsPublished: false, rankingsPublished: false },
    ];

    const { result } = renderHook(() => useWeekSelection(weeks, 'latest-complete'));

    act(() => {
      result.current.setSelectedWeek(6);
    });

    expect(result.current.selectedWeek).toBe(6);
  });

  it('returns null when no weeks provided', () => {
    const { result } = renderHook(() => useWeekSelection(undefined));

    expect(result.current.selectedWeek).toBeNull();
  });

  it('returns null when weeks array is empty', () => {
    const { result } = renderHook(() => useWeekSelection([]));

    expect(result.current.selectedWeek).toBeNull();
  });
});
