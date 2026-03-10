import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useChartColors } from '../../hooks/use-chart-colors';

vi.mock('../../contexts/theme-context', () => ({
  useTheme: vi.fn(),
}));

import { useTheme } from '../../contexts/theme-context';

const mockUseTheme = vi.mocked(useTheme);

describe('useChartColors', () => {
  it('returns light theme colors when resolvedTheme is light', () => {
    mockUseTheme.mockReturnValue({ resolvedTheme: 'light', theme: 'light', setTheme: vi.fn() });

    const { result } = renderHook(() => useChartColors());

    expect(result.current.axis).toBe('#d1d5db');
    expect(result.current.grid).toBe('#e5e7eb');
    expect(result.current.text).toBe('#6b7280');
  });

  it('returns dark theme colors when resolvedTheme is dark', () => {
    mockUseTheme.mockReturnValue({ resolvedTheme: 'dark', theme: 'dark', setTheme: vi.fn() });

    const { result } = renderHook(() => useChartColors());

    expect(result.current.axis).toBe('#4b5563');
    expect(result.current.grid).toBe('#374151');
    expect(result.current.text).toBe('#9ca3af');
  });
});
