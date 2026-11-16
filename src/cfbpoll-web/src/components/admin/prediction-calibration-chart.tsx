import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { useChartColors } from '../../hooks/use-chart-colors';

export interface CalibrationChartPoint {
  label: string;
  overUnder: number;
  spread: number;
  winner: number;
}

interface PredictionCalibrationChartProps {
  comparedLabel: string;
  points: CalibrationChartPoint[];
}

type ChartMetric = 'overUnder' | 'spread' | 'winner';

const GAIN_COLOR = '#16a34a';
const LOSS_COLOR = '#dc2626';
const METRICS: { column: string; key: ChartMetric; label: string; noun: string }[] = [
  { column: 'Winner', key: 'winner', label: 'Winner', noun: 'winners' },
  { column: 'Spread', key: 'spread', label: 'Spread', noun: 'spreads' },
  { column: 'O/U', key: 'overUnder', label: 'O/U', noun: 'over/unders' },
];
const TOGGLE_CLASSES = 'px-3 py-1 text-xs font-medium transition-colors duration-150';

/**
 * One bar per week for the chosen record (spread by default): how many more (above zero) or fewer (below
 * zero) picks the compared values got right than the values used that week.
 */
export function PredictionCalibrationChart({ comparedLabel, points }: PredictionCalibrationChartProps) {
  const [metricKey, setMetricKey] = useState<ChartMetric>('spread');
  const chartColors = useChartColors();

  const metric = METRICS.find((m) => m.key === metricKey) ?? METRICS[1];

  return (
    <figure className="space-y-2">
      <div className="inline-flex rounded-lg border border-border overflow-hidden" role="group" aria-label="Chart record">
        {METRICS.map((m) => (
          <button
            key={m.key}
            aria-pressed={m.key === metricKey}
            className={`${TOGGLE_CLASSES} ${m.key === metricKey ? 'bg-accent text-white' : 'bg-surface text-text-secondary hover:bg-surface-alt'}`}
            onClick={() => setMetricKey(m.key)}
            type="button"
          >
            {m.label}
          </button>
        ))}
      </div>
      <figcaption className="text-xs text-text-muted max-w-prose">
        Each bar is one week’s {metric.label} difference, the same number as the {metric.column} column below. Green
        bars are weeks where {comparedLabel} would have gotten more {metric.noun} right; red bars are weeks where they
        would have gotten fewer.
      </figcaption>
      <ResponsiveContainer height={180} width="100%">
        <BarChart data={points} margin={{ bottom: 0, left: -20, right: 8, top: 8 }}>
          <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" stroke={chartColors.axis} tick={{ fill: chartColors.text, fontSize: 12 }} />
          <YAxis allowDecimals={false} stroke={chartColors.axis} tick={{ fill: chartColors.text, fontSize: 12 }} />
          <ReferenceLine stroke={chartColors.text} y={0} />
          <Tooltip cursor={{ fill: chartColors.grid, fillOpacity: 0.4 }} formatter={(value) => [value, `${metric.label} difference`]} />
          <Bar dataKey={metricKey} isAnimationActive={false}>
            {points.map((p) => (
              <Cell key={p.label} fill={p[metricKey] >= 0 ? GAIN_COLOR : LOSS_COLOR} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </figure>
  );
}
