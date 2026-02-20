import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWeekSelection } from '../../hooks/use-week-selection';
import type { Week } from '../../types';

describe('useWeekSelection', () => {
  it('returns null when no weeks provided', () => {
    const { result } = renderHook(() => useWeekSelection(undefined));

    expect(result.current.selectedWeek).toBeNull();
  });

  it('returns null when weeks array is empty', () => {
    const { result } = renderHook(() => useWeekSelection([]));

    expect(result.current.selectedWeek).toBeNull();
  });

  it('auto-selects last week when weeks are available', () => {
    const weeks: Week[] = [
      { weekNumber: 1, label: 'Week 1' },
      { weekNumber: 5, label: 'Week 5' },
    ];

    const { result } = renderHook(() => useWeekSelection(weeks));

    expect(result.current.selectedWeek).toBe(5);
  });

  it('preserves manual selection', () => {
    const weeks: Week[] = [
      { weekNumber: 1, label: 'Week 1' },
      { weekNumber: 5, label: 'Week 5' },
    ];

    const { result } = renderHook(() => useWeekSelection(weeks));

    act(() => {
      result.current.setSelectedWeek(1);
    });

    expect(result.current.selectedWeek).toBe(1);
  });

  it('auto-selects when reset to null', () => {
    const weeks: Week[] = [
      { weekNumber: 1, label: 'Week 1' },
      { weekNumber: 5, label: 'Week 5' },
    ];

    const { result } = renderHook(() => useWeekSelection(weeks));

    act(() => {
      result.current.setSelectedWeek(null);
    });

    expect(result.current.selectedWeek).toBe(5);
  });

  it('auto-selects when weeks data arrives later', () => {
    const weeks: Week[] = [
      { weekNumber: 1, label: 'Week 1' },
      { weekNumber: 3, label: 'Week 3' },
    ];

    const { result, rerender } = renderHook(
      ({ w }: { w: Week[] | undefined }) => useWeekSelection(w),
      { initialProps: { w: undefined } }
    );

    expect(result.current.selectedWeek).toBeNull();

    rerender({ w: weeks });

    expect(result.current.selectedWeek).toBe(3);
  });
});
