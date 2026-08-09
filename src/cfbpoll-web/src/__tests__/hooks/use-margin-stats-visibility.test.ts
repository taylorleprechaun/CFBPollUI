import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useMarginStatsVisibility } from '../../hooks/use-margin-stats-visibility';

beforeEach(() => {
  localStorage.clear();
});

describe('useMarginStatsVisibility', () => {
  it('defaults to hidden when localStorage has an unrecognized value', () => {
    localStorage.setItem('cfbpoll_show_margin_stats', 'nonsense');

    const { result } = renderHook(() => useMarginStatsVisibility());

    expect(result.current.showMarginStats).toBe(false);
  });

  it('defaults to hidden when localStorage is empty', () => {
    const { result } = renderHook(() => useMarginStatsVisibility());

    expect(result.current.showMarginStats).toBe(false);
  });

  it('persists the visibility choice to localStorage when toggled', () => {
    const { result } = renderHook(() => useMarginStatsVisibility());

    act(() => {
      result.current.toggleMarginStats();
    });

    expect(localStorage.getItem('cfbpoll_show_margin_stats')).toBe('true');
  });

  it('restores a previously persisted visible state', () => {
    localStorage.setItem('cfbpoll_show_margin_stats', 'true');

    const { result } = renderHook(() => useMarginStatsVisibility());

    expect(result.current.showMarginStats).toBe(true);
  });

  it('toggles back to hidden and persists it', () => {
    localStorage.setItem('cfbpoll_show_margin_stats', 'true');

    const { result } = renderHook(() => useMarginStatsVisibility());

    act(() => {
      result.current.toggleMarginStats();
    });

    expect(result.current.showMarginStats).toBe(false);
    expect(localStorage.getItem('cfbpoll_show_margin_stats')).toBe('false');
  });

  it('toggles from hidden to visible', () => {
    const { result } = renderHook(() => useMarginStatsVisibility());

    act(() => {
      result.current.toggleMarginStats();
    });

    expect(result.current.showMarginStats).toBe(true);
  });
});
