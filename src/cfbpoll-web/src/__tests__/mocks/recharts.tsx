import type { ReactNode } from 'react';
import { vi } from 'vitest';

export const mockUsePlotArea = vi.fn(
  (): { height: number; width: number; x: number; y: number } | undefined =>
    ({ height: 400, width: 600, x: 50, y: 20 })
);

export const mockUseXAxisDomain = vi.fn(
  (): number[] | undefined => [0, 20]
);

export const mockUseYAxisDomain = vi.fn(
  (): number[] | undefined => [0, 12]
);

export const rechartsMock = {
  CartesianGrid: () => null,
  getNiceTickValues: (domain: [number, number]) => {
    const [min, max] = domain;
    if (min === max) return [min];
    const step = Math.ceil((max - min) / 4);
    const ticks = [];
    for (let i = min; i <= max + step; i += step) ticks.push(i);
    return ticks;
  },
  ResponsiveContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Scatter: () => null,
  ScatterChart: ({ children }: { children: ReactNode }) => <div data-testid="scatter-chart">{children}</div>,
  Tooltip: () => null,
  usePlotArea: mockUsePlotArea,
  useXAxisDomain: mockUseXAxisDomain,
  useYAxisDomain: mockUseYAxisDomain,
  XAxis: () => null,
  YAxis: () => null,
};
