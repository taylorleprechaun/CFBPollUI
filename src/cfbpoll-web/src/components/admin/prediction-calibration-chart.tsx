import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { useChartColors } from '../../hooks/use-chart-colors';

export interface CalibrationChartPoint {
  label: string;
  overUnder: number;
  spread: number;
  winner: number;
}

interface PredictionCalibrationChartProps {
  points: CalibrationChartPoint[];
}

const SERIES = [
  { color: '#94a3b8', key: 'winner', label: 'Winner', width: 2 },
  { color: '#2563eb', key: 'spread', label: 'Spread', width: 3 },
  { color: '#f59e0b', key: 'overUnder', label: 'O/U', width: 2 },
] as const;

/**
 * Running total, week by week, of how many more picks the compared values got right than the values used.
 * Above zero means the compared values were ahead at that point.
 */
export function PredictionCalibrationChart({ points }: PredictionCalibrationChartProps) {
  const chartColors = useChartColors();

  return (
    <figure>
      <figcaption className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted mb-2">
        <span>Running total of extra correct picks</span>
        {SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-1">
            <span aria-hidden="true" className="inline-block w-3 h-0.5" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </figcaption>
      <ResponsiveContainer height={200} width="100%">
        <LineChart data={points} margin={{ bottom: 0, left: -20, right: 8, top: 8 }}>
          <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
          <XAxis dataKey="label" stroke={chartColors.axis} tick={{ fill: chartColors.text, fontSize: 12 }} />
          <YAxis allowDecimals={false} stroke={chartColors.axis} tick={{ fill: chartColors.text, fontSize: 12 }} />
          <ReferenceLine stroke={chartColors.text} y={0} />
          <Tooltip />
          {SERIES.map((s) => (
            <Line key={s.key} dataKey={s.key} dot={false} isAnimationActive={false} name={s.label} stroke={s.color} strokeWidth={s.width} type="linear" />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </figure>
  );
}
