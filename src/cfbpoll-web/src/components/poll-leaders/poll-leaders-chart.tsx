import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CartesianGrid,
  getNiceTickValues,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  usePlotArea,
  useXAxisDomain,
  useYAxisDomain,
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
  tooltipMinTop?: number;
  topN: '5' | '10';
}

const LOGO_SIZE = 24;
const TICK_COUNT = 5;

function getNiceDomain(domain: [number, number]): [number, number] {
  const niceTicks = getNiceTickValues(domain, TICK_COUNT, false);
  if (niceTicks.length === 0) return domain;
  return [
    Math.min(domain[0], niceTicks[0]),
    Math.max(domain[1], niceTicks[niceTicks.length - 1]),
  ];
}

function projectToPixel(value: number, min: number, range: number, origin: number, size: number): number {
  const normalized = range === 0 ? 0.5 : (value - min) / range;
  return origin + normalized * size;
}

interface HitTargetProps {
  cx?: number;
  cy?: number;
}

export function HitTarget({ cx, cy }: HitTargetProps) {
  if (cx === undefined || cy === undefined) return null;
  return (
    <rect
      x={cx - LOGO_SIZE / 2}
      y={cy - LOGO_SIZE / 2}
      width={LOGO_SIZE}
      height={LOGO_SIZE}
      fill="transparent"
    />
  );
}

interface LogoOverlayProps {
  data: ChartDataPoint[];
}

function LogoOverlay({ data }: LogoOverlayProps) {
  const [fadingIn, setFadingIn] = useState<Set<string>>(new Set());

  const prevTeamsRef = useRef<Set<string> | null>(null);

  const plotArea = usePlotArea();
  const xDomain = useXAxisDomain();
  const yDomain = useYAxisDomain();

  const currentTeams = useMemo(() => new Set(data.map((p) => p.teamName)), [data]);

  useEffect(() => {
    if (prevTeamsRef.current === null) {
      prevTeamsRef.current = currentTeams;
      return;
    }

    const newTeams = new Set<string>();
    for (const team of currentTeams) {
      if (!prevTeamsRef.current.has(team)) {
        newTeams.add(team);
      }
    }
    prevTeamsRef.current = currentTeams;

    if (newTeams.size === 0) return;

    setFadingIn(newTeams);
    const frameId = requestAnimationFrame(() => {
      setFadingIn(new Set());
    });
    return () => cancelAnimationFrame(frameId);
  }, [currentTeams]);

  if (!plotArea || !xDomain || !yDomain) return null;

  const [xMin, xMax] = getNiceDomain(xDomain as [number, number]);
  const [yMin, yMax] = getNiceDomain(yDomain as [number, number]);
  const xRange = xMax - xMin;
  const yRange = yMax - yMin;

  return (
    <g>
      {data.map((point) => {
        const cx = projectToPixel(point.x, xMin, xRange, plotArea.x, plotArea.width);
        const cy = plotArea.y + plotArea.height - projectToPixel(point.y, yMin, yRange, 0, plotArea.height);
        return (
          <image
            key={point.teamName}
            width={LOGO_SIZE}
            height={LOGO_SIZE}
            href={point.logoURL}
            aria-label={point.teamName}
            pointerEvents="none"
            style={{
              opacity: fadingIn.has(point.teamName) ? 0 : 1,
              transform: `translate(${cx - LOGO_SIZE / 2}px, ${cy - LOGO_SIZE / 2}px)`,
              transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-in',
            }}
          />
        );
      })}
    </g>
  );
}

export function PollLeadersChart({
  children,
  data,
  mode,
  onModeChange,
  onTopNChange,
  tooltipMinTop,
  topN,
}: PollLeadersChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const chartData = useMemo<ChartDataPoint[]>(
    () =>
      data
        .map((entry) => ({
          logoURL: entry.logoURL,
          teamName: entry.teamName,
          top5Count: entry.top5Count,
          top10Count: entry.top10Count,
          top25Count: entry.top25Count,
          x: entry.top25Count,
          y: topN === '5' ? entry.top5Count : entry.top10Count,
        }))
        .sort((a, b) => a.teamName.localeCompare(b.teamName)),
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
                  minTop={tooltipMinTop}
                  topN={topN}
                />
              }
              cursor={false}
              isAnimationActive={false}
            />
            <Scatter
              data={chartData}
              isAnimationActive={false}
              shape={<HitTarget />}
            />
            <LogoOverlay data={chartData} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
