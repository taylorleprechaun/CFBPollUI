import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

import type { SeasonTrendsResponse } from '../../schemas';
import { useChartColors } from '../../hooks/use-chart-colors';
import { SeasonTrendsTooltip } from './season-trends-tooltip';

interface SeasonTrendsChartProps {
  data: SeasonTrendsResponse;
}

interface TeamDotProps {
  chartData: Record<string, number | string | null>[];
  cx?: number;
  cy?: number;
  index?: number;
  logoURL: string;
  onClick: () => void;
  onHover: (index: number, cx: number, cy: number) => void;
  onMouseLeave: () => void;
  opacity: number;
  teamName: string;
  value?: number | null;
}

const TeamDot = memo(function TeamDot({ chartData, cx, cy, index, logoURL, onClick, onHover, onMouseLeave, opacity, teamName, value }: TeamDotProps) {
  if (value === null || value === undefined || cx === undefined || cy === undefined || index === undefined) {
    return null;
  }

  const prevRanked = index > 0 && chartData[index - 1][teamName] !== null;
  const nextRanked = index < chartData.length - 1 && chartData[index + 1][teamName] !== null;
  const isEndpoint = !prevRanked || !nextRanked;
  const size = isEndpoint ? 28 : 14;
  const hitSize = 30;

  return (
    <g>
      <rect
        x={cx - hitSize / 2}
        y={cy - hitSize / 2}
        width={hitSize}
        height={hitSize}
        fill="transparent"
        onClick={(e: React.MouseEvent) => { e.stopPropagation(); onClick(); }}
        onMouseEnter={() => onHover(index, cx, cy)}
        onMouseLeave={onMouseLeave}
        style={{ cursor: 'pointer' }}
      />
      <image
        xlinkHref={logoURL}
        x={cx - size / 2}
        y={cy - size / 2}
        width={size}
        height={size}
        style={{ pointerEvents: 'none', opacity }}
      />
    </g>
  );
});

const Y_AXIS_TICKS = Array.from({ length: 25 }, (_, i) => i + 1);

export function SeasonTrendsChart({ data }: SeasonTrendsChartProps) {
  const chartColors = useChartColors();
  const chartRef = useRef<HTMLDivElement>(null);
  const [hoveredTeam, setHoveredTeam] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [activeWeek, setActiveWeek] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const chartData = useMemo(() => {
    return data.weeks.map((week) => {
      const point: Record<string, number | string | null> = {
        weekLabel: week.label,
        weekNumber: week.weekNumber,
      };

      for (const team of data.teams) {
        const ranking = team.rankings.find((r) => r.weekNumber === week.weekNumber);
        point[team.teamName] = ranking?.rank ?? null;
      }

      return point;
    });
  }, [data]);

  const handleDotHover = useCallback((teamName: string, weekIndex: number, cx: number, cy: number) => {
    setHoveredTeam(teamName);
    const week = data.weeks[weekIndex];
    setActiveWeek(week?.weekNumber ?? null);
    setTooltipPos({ x: cx, y: cy });
  }, [data.weeks]);

  const handleMouseLeave = useCallback(() => {
    setHoveredTeam(null);
    setActiveWeek(null);
    setTooltipPos(null);
  }, []);

  const handleClick = useCallback((teamName: string) => {
    setSelectedTeam((prev) => (prev === teamName ? null : teamName));
  }, []);

  const activeTeam = selectedTeam ?? hoveredTeam;

  const showTooltip = hoveredTeam !== null && (selectedTeam === null || selectedTeam === hoveredTeam);

  const tooltipTeamData = useMemo(
    () => (showTooltip ? data.teams.find((t) => t.teamName === hoveredTeam) ?? null : null),
    [data.teams, hoveredTeam, showTooltip]
  );

  const lastTooltipRef = useRef<{ team: typeof tooltipTeamData; week: number | null; pos: { x: number; y: number } }>({
    team: null, week: null, pos: { x: 0, y: 0 },
  });

  useEffect(() => {
    if (tooltipTeamData && tooltipPos) {
      lastTooltipRef.current = { team: tooltipTeamData, week: activeWeek, pos: tooltipPos };
    }
  }, [tooltipTeamData, tooltipPos, activeWeek]);

  if (data.teams.length === 0) return null;

  return (
    <div>
      <h2 className="text-2xl font-bold text-text-primary mb-4 text-center">{data.season} Rank Progression</h2>
      <div className="bg-surface rounded-xl shadow-md p-4 relative" ref={chartRef}>
        <ResponsiveContainer width="100%" height={1200}>
          <LineChart
            data={chartData}
            margin={{ top: 40, right: 30, bottom: 25, left: 30 }}
            onClick={() => setSelectedTeam(null)}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
            {data.weeks.map((week, i) =>
              i % 2 === 0 ? (
                <ReferenceArea
                  key={week.weekNumber}
                  x1={week.label}
                  x2={data.weeks[i + 1]?.label ?? week.label}
                  fill={chartColors.grid}
                  fillOpacity={0.15}
                  ifOverflow="extendDomain"
                />
              ) : null
            )}
            <XAxis
              dataKey="weekLabel"
              orientation="top"
              tick={{ fill: chartColors.text, fontSize: 12 }}
              stroke={chartColors.axis}
              padding={{ left: 20, right: 20 }}
              label={{
                value: 'Week',
                position: 'top',
                offset: 20,
                style: { fill: chartColors.text, fontSize: 14, fontWeight: 600 },
              }}
            />
            <YAxis
              yAxisId="left"
              reversed
              domain={[1, 25]}
              allowDecimals={false}
              ticks={Y_AXIS_TICKS}
              tick={{ fill: chartColors.text, fontSize: 11 }}
              stroke={chartColors.axis}
              padding={{ top: 20, bottom: 20 }}
              label={{
                value: 'Rank',
                angle: -90,
                position: 'insideLeft',
                offset: -15,
                style: { textAnchor: 'middle', fill: chartColors.text, fontSize: 14, fontWeight: 600 },
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              reversed
              domain={[1, 25]}
              allowDecimals={false}
              ticks={Y_AXIS_TICKS}
              tick={{ fill: chartColors.text, fontSize: 11 }}
              stroke={chartColors.axis}
              padding={{ top: 20, bottom: 20 }}
              label={{
                value: 'Rank',
                angle: 90,
                position: 'insideRight',
                offset: -15,
                style: { textAnchor: 'middle', fill: chartColors.text, fontSize: 14, fontWeight: 600 },
              }}
            />
            {/* Recharts won't render a YAxis unless at least one Line references its yAxisId.
               This invisible line binds to the right axis so it renders rank ticks on both sides. */}
            <Line
              yAxisId="right"
              dataKey={data.teams[0]?.teamName}
              stroke="transparent"
              dot={false}
              activeDot={false}
              isAnimationActive={false}
              connectNulls={false}
            />
            {data.teams.map((team) => {
              const isActive = activeTeam === team.teamName;
              const opacity = activeTeam === null ? 1 : isActive ? 1 : 0.15;
              const strokeWidth = activeTeam !== null && isActive ? 3 : 1.5;

              return (
                <Line
                  key={team.teamName}
                  yAxisId="left"
                  type="linear"
                  dataKey={team.teamName}
                  stroke={team.color || '#6b7280'}
                  strokeOpacity={opacity}
                  strokeWidth={strokeWidth}
                  dot={(dotProps: Record<string, unknown>) => (
                    <TeamDot
                      cx={dotProps.cx as number | undefined}
                      cy={dotProps.cy as number | undefined}
                      index={dotProps.index as number | undefined}
                      value={dotProps.value as number | null | undefined}
                      logoURL={team.logoURL}
                      teamName={team.teamName}
                      chartData={chartData}
                      onClick={() => handleClick(team.teamName)}
                      onHover={(weekIndex: number, cx: number, cy: number) => handleDotHover(team.teamName, weekIndex, cx, cy)}
                      onMouseLeave={handleMouseLeave}
                      opacity={opacity}
                    />
                  )}
                  activeDot={false}
                  connectNulls={false}
                  isAnimationActive={false}
                  style={{ pointerEvents: 'none' }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
        <div
          className="absolute pointer-events-none z-10"
          style={{
            left: (tooltipPos?.x ?? lastTooltipRef.current.pos.x) + 16,
            top: (tooltipPos?.y ?? lastTooltipRef.current.pos.y) - 16,
            opacity: tooltipTeamData ? 1 : 0,
            transform: tooltipTeamData ? 'translateY(0)' : 'translateY(4px)',
            transition: 'opacity 150ms ease-out, transform 150ms ease-out',
          }}
        >
          <SeasonTrendsTooltip
            activeWeek={tooltipTeamData ? activeWeek : lastTooltipRef.current.week}
            hoveredTeam={tooltipTeamData ?? lastTooltipRef.current.team}
            weeks={data.weeks}
          />
        </div>
      </div>
    </div>
  );
}
