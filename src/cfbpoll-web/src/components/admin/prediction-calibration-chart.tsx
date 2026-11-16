import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import type { CalibrationRecordKey } from '../../lib/calibration-utils';

import { useChartColors } from '../../hooks/use-chart-colors';
import { CALIBRATION_RECORDS } from '../../lib/calibration-utils';
import { SegmentedToggle } from '../ui/segmented-toggle';

export type CalibrationChartPoint = Record<CalibrationRecordKey, number> & { label: string };

interface PredictionCalibrationChartProps {
  comparedLabel: string;
  points: CalibrationChartPoint[];
}

const RECORD_OPTIONS = CALIBRATION_RECORDS.map((r) => ({ label: r.label, value: r.key }));

/**
 * One bar per week for the chosen record (spread by default): how many more (above zero) or fewer (below
 * zero) picks the compared values got right than the values used that week.
 */
export function PredictionCalibrationChart({ comparedLabel, points }: PredictionCalibrationChartProps) {
  const [recordKey, setRecordKey] = useState<CalibrationRecordKey>('spread');
  const chartColors = useChartColors();

  const record = CALIBRATION_RECORDS.find((r) => r.key === recordKey) ?? CALIBRATION_RECORDS[1];

  return (
    <figure className="space-y-2">
      <SegmentedToggle ariaLabel="Chart record" onChange={setRecordKey} options={RECORD_OPTIONS} size="sm" value={recordKey} />
      <figcaption className="text-xs text-text-muted max-w-prose">
        Each bar is one week’s {record.label} difference, the same number as the {record.label} column below. Green
        bars are weeks where {comparedLabel} would have gotten more {record.noun} right; red bars are weeks where they
        would have gotten fewer.
      </figcaption>
      <ResponsiveContainer height={180} width="100%">
        <BarChart data={points} margin={{ bottom: 0, left: -20, right: 8, top: 8 }}>
          <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" stroke={chartColors.axis} tick={{ fill: chartColors.text, fontSize: 12 }} />
          <YAxis allowDecimals={false} stroke={chartColors.axis} tick={{ fill: chartColors.text, fontSize: 12 }} />
          <ReferenceLine stroke={chartColors.text} y={0} />
          <Tooltip cursor={{ fill: chartColors.grid, fillOpacity: 0.4 }} formatter={(value) => [value, `${record.label} difference`]} />
          <Bar dataKey={recordKey} isAnimationActive={false}>
            {points.map((p) => (
              <Cell key={p.label} fill={p[recordKey] >= 0 ? chartColors.gain : chartColors.loss} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </figure>
  );
}
