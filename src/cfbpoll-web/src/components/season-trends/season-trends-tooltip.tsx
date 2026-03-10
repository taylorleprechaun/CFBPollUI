import type { SeasonTrendTeam, SeasonTrendWeek } from '../../schemas';
import { getContrastTextColor } from '../../lib/color-utils';

interface SeasonTrendsTooltipProps {
  activeWeek: number | null;
  hoveredTeam: SeasonTrendTeam | null;
  weeks: SeasonTrendWeek[];
}

export function SeasonTrendsTooltip({ activeWeek, hoveredTeam, weeks }: SeasonTrendsTooltipProps) {
  if (!hoveredTeam || activeWeek === null) return null;

  const ranking = hoveredTeam.rankings.find((r) => r.weekNumber === activeWeek);
  if (!ranking) return null;

  const weekLabel = weeks.find((w) => w.weekNumber === activeWeek)?.label ?? `Week ${activeWeek}`;
  const bgColor = hoveredTeam.color || '#374151';
  const textColor = getContrastTextColor(bgColor);

  return (
    <div
      className="rounded-lg shadow-lg p-3 text-sm min-w-40"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <div className="flex items-center gap-2 mb-1">
        <img src={hoveredTeam.logoURL} alt={hoveredTeam.teamName} className="w-5 h-5 object-contain bg-surface rounded-md p-0.5" />
        <span className="font-semibold">{hoveredTeam.teamName}</span>
      </div>
      <div className="text-xs opacity-90">{weekLabel}</div>
      {ranking.rank !== null ? (
        <div className="mt-1 space-y-0.5">
          <div>Rank: #{ranking.rank}</div>
          <div>Rating: {ranking.rating.toFixed(2)}</div>
          <div>Record: {ranking.record}</div>
        </div>
      ) : (
        <div className="mt-1 opacity-75">Unranked</div>
      )}
    </div>
  );
}
