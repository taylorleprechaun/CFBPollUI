import { useMemo, useRef } from 'react';
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { PollLeaderEntry } from '../../schemas';

import { ClusterTooltip } from './cluster-tooltip';
import type { ChartDataPoint } from './types';

interface PollLeadersChartProps {
  children?: React.ReactNode;
  data: PollLeaderEntry[];
  mode: 'all' | 'final';
  onModeChange: (mode: 'all' | 'final') => void;
  onTopNChange: (topN: '5' | '10') => void;
  topN: '5' | '10';
}

const LOGO_SIZE = 24;

function CustomShape(props: { cx?: number; cy?: number; payload?: ChartDataPoint }) {
  const { cx, cy, payload } = props;
  if (cx === undefined || cy === undefined || !payload) return null;

  return (
    <image
      x={cx - LOGO_SIZE / 2}
      y={cy - LOGO_SIZE / 2}
      width={LOGO_SIZE}
      height={LOGO_SIZE}
      href={payload.logoURL}
      aria-label={payload.teamName}
    />
  );
}

export function PollLeadersChart({
  children,
  data,
  mode,
  onModeChange,
  onTopNChange,
  topN,
}: PollLeadersChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const chartData = useMemo<ChartDataPoint[]>(
    () =>
      data.map((entry) => ({
        logoURL: entry.logoURL,
        teamName: entry.teamName,
        top5Count: entry.top5Count,
        top10Count: entry.top10Count,
        top25Count: entry.top25Count,
        x: entry.top25Count,
        y: topN === '5' ? entry.top5Count : entry.top10Count,
      })),
    [data, topN]
  );

  const yAxisLabel = topN === '5' ? 'Times Ranked in Top 5' : 'Times Ranked in Top 10';

  return (
    <div>
      <div className="w-fit flex flex-col gap-2 mb-4">
        {children}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex rounded-lg border border-gray-300 overflow-hidden" role="group" aria-label="Data mode">
            <button
              type="button"
              aria-pressed={mode === 'all'}
              onClick={() => onModeChange('all')}
              className={`px-4 py-1.5 text-sm font-medium ${
                mode === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              All Weeks
            </button>
            <button
              type="button"
              aria-pressed={mode === 'final'}
              onClick={() => onModeChange('final')}
              className={`px-4 py-1.5 text-sm font-medium ${
                mode === 'final'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Final Only
            </button>
          </div>

          <div className="flex rounded-lg border border-gray-300 overflow-hidden" role="group" aria-label="Y-axis selection">
            <button
              type="button"
              aria-pressed={topN === '5'}
              onClick={() => onTopNChange('5')}
              className={`px-4 py-1.5 text-sm font-medium ${
                topN === '5'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Top 5
            </button>
            <button
              type="button"
              aria-pressed={topN === '10'}
              onClick={() => onTopNChange('10')}
              className={`px-4 py-1.5 text-sm font-medium ${
                topN === '10'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Top 10
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4" ref={containerRef}>
        <ResponsiveContainer width="100%" height={500}>
          <ScatterChart
            margin={{ top: 20, right: 30, bottom: 20, left: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="x"
              name="Times Ranked in Top 25"
              label={{ value: 'Times Ranked in Top 25', position: 'bottom', offset: 0 }}
              allowDecimals={false}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={yAxisLabel}
              label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', offset: 10, style: { textAnchor: 'middle' } }}
              allowDecimals={false}
            />
            <Tooltip
              content={
                <ClusterTooltip
                  allPoints={chartData}
                  containerRef={containerRef}
                  topN={topN}
                />
              }
              cursor={false}
              isAnimationActive={false}
            />
            <Scatter
              data={chartData}
              shape={<CustomShape />}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
