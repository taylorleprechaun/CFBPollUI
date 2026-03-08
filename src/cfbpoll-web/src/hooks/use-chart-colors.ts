import { useMemo } from 'react';

import { useTheme } from '../contexts/theme-context';

interface ChartColors {
  axis: string;
  grid: string;
  text: string;
}

export function useChartColors(): ChartColors {
  const { resolvedTheme } = useTheme();

  return useMemo(() => ({
    axis: resolvedTheme === 'dark' ? '#4b5563' : '#d1d5db',
    grid: resolvedTheme === 'dark' ? '#374151' : '#e5e7eb',
    text: resolvedTheme === 'dark' ? '#9ca3af' : '#6b7280',
  }), [resolvedTheme]);
}
