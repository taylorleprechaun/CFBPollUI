import { useMemo } from 'react';

import { useTheme } from './use-theme';

interface ChartColors {
  axis: string;
  gain: string;
  grid: string;
  loss: string;
  text: string;
}

export function useChartColors(): ChartColors {
  const { resolvedTheme } = useTheme();

  return useMemo(() => ({
    axis: resolvedTheme === 'dark' ? '#4b5563' : '#d1d5db',
    gain: resolvedTheme === 'dark' ? '#22c55e' : '#16a34a',
    grid: resolvedTheme === 'dark' ? '#374151' : '#e5e7eb',
    loss: resolvedTheme === 'dark' ? '#ef4444' : '#dc2626',
    text: resolvedTheme === 'dark' ? '#9ca3af' : '#6b7280',
  }), [resolvedTheme]);
}
