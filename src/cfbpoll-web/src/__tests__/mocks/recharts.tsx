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
  Line: ({ dot, dataKey }: { dot?: ((props: Record<string, unknown>) => ReactNode) | boolean; dataKey?: string }) => {
    if (typeof dot === 'function') {
      return (
        <g data-testid={`line-${dataKey}`}>
          {dot({ cx: 100, cy: 200, index: 0, value: 5 })}
          {dot({ cx: 200, cy: 100, index: 1, value: 3 })}
          {dot({ cx: 300, cy: 50, index: 2, value: null })}
        </g>
      );
    }
    return null;
  },
  ReferenceArea: () => null,
  LineChart: ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
    <div data-testid="line-chart" onClick={onClick}>{children}</div>
  ),
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
