import { useCallback, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
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
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  opacity: number;
  teamName: string;
  value?: number | null;
}

function TeamDot({ chartData, cx, cy, index, logoURL, onClick, onMouseEnter, onMouseLeave, opacity, teamName, value }: TeamDotProps) {
  if (value === null || value === undefined || cx === undefined || cy === undefined || index === undefined) {
    return null;
  }

  const prevRanked = index > 0 && chartData[index - 1][teamName] !== null;
  const nextRanked = index < chartData.length - 1 && chartData[index + 1][teamName] !== null;
  const isEndpoint = !prevRanked || !nextRanked;
  const size = isEndpoint ? 28 : 14;

  return (
    <image
      xlinkHref={logoURL}
      x={cx - size / 2}
      y={cy - size / 2}
      width={size}
      height={size}
      onClick={(e: React.MouseEvent) => { e.stopPropagation(); onClick(); }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ cursor: 'pointer', opacity }}
    />
  );
}

const Y_AXIS_TICKS = Array.from({ length: 25 }, (_, i) => i + 1);

export function SeasonTrendsChart({ data }: SeasonTrendsChartProps) {
  const chartColors = useChartColors();
  const [hoveredTeam, setHoveredTeam] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [activeWeek, setActiveWeek] = useState<number | null>(null);

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

  const handleMouseEnter = useCallback((teamName: string) => {
    setHoveredTeam(teamName);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredTeam(null);
  }, []);

  const handleClick = useCallback((teamName: string) => {
    setSelectedTeam((prev) => (prev === teamName ? null : teamName));
  }, []);

  const handleTooltipChange = useCallback((props: { activeLabel?: string | number }) => {
    if (props.activeLabel) {
      const label = String(props.activeLabel);
      const week = data.weeks.find((w) => w.label === label);
      setActiveWeek(week?.weekNumber ?? null);
    }
  }, [data.weeks]);

  const activeTeam = selectedTeam ?? hoveredTeam;

  const activeTeamData = useMemo(
    () => data.teams.find((t) => t.teamName === activeTeam) ?? null,
    [data.teams, activeTeam]
  );

  if (data.teams.length === 0) return null;

  return (
    <div>
      <h2 className="text-2xl font-bold text-text-primary mb-4 text-center">{data.season} Rank Progression</h2>
      <div className="bg-surface rounded-xl shadow-md p-4">
        <ResponsiveContainer width="100%" height={1200}>
          <LineChart
            data={chartData}
            margin={{ top: 40, right: 30, bottom: 25, left: 30 }}
            onMouseMove={handleTooltipChange}
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
            <Tooltip
              content={
                <SeasonTrendsTooltip
                  activeWeek={activeWeek}
                  hoveredTeam={activeTeamData}
                  weeks={data.weeks}
                />
              }
              trigger="hover"
              cursor={false}
              isAnimationActive={false}
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
                      onMouseEnter={() => handleMouseEnter(team.teamName)}
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
      </div>
    </div>
  );
}
