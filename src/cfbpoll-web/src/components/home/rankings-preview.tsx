import { Link } from 'react-router-dom';

import type { RankedTeam } from '../../types';

import { TeamLogo } from '../rankings/team-logo';
import { TableSkeleton } from '../ui/table-skeleton';

interface RankingsPreviewProps {
  isLoading: boolean;
  rankings: RankedTeam[];
  season: number | null;
  weekLabel: string | null;
}

const COLUMN_COUNT = 5;
const DELTA_ARROW_PATH = "M11.96 24.231l8.344-8.49-0.893-0.916-6.801 6.897v-18.677h-1.302v18.677l-6.801-6.897-0.917 0.916z";

export function RankingsPreview({ isLoading, rankings, season, weekLabel }: RankingsPreviewProps) {
  return (
    <div className="bg-surface border border-border rounded-xl shadow-md overflow-hidden">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border">
        <h2 className="text-lg font-semibold text-text-primary">This Week&rsquo;s Rankings</h2>
        {season !== null && weekLabel !== null && (
          <span className="text-lg font-semibold text-text-primary">Season {season} &middot; {weekLabel}</span>
        )}
      </div>

      {isLoading ? (
        <TableSkeleton columns={COLUMN_COUNT} rows={10} />
      ) : rankings.length === 0 ? (
        <div className="px-4 sm:px-6 py-10 text-center text-text-muted">
          Rankings for this season haven&rsquo;t been published yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-surface-alt">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Team</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Record</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Rating</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">&Delta;</th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border">
              {rankings.map((team) => (
                <tr key={team.teamName} className="even:bg-surface-alt/50">
                  <td className="px-4 py-3 text-sm text-text-primary">{team.rank}</td>
                  <td className="px-4 py-3 text-sm text-text-primary">
                    <div className="flex items-center gap-3">
                      <TeamLogo logoURL={team.logoURL} teamName={team.teamName} />
                      <span className="font-medium">{team.teamName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{team.record}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary text-right">{team.rating.toFixed(4)}</td>
                  <td className="px-4 py-3 text-sm text-right">
                    {team.rankDelta !== null && team.rankDelta > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-green-600 dark:text-green-400">
                        <svg width="12" height="14" viewBox="0 0 24 27" aria-hidden="true">
                          <path d={DELTA_ARROW_PATH} fill="currentColor" transform="rotate(180 12 13.5)" />
                        </svg>
                        {team.rankDelta}
                      </span>
                    )}
                    {team.rankDelta !== null && team.rankDelta < 0 && (
                      <span className="inline-flex items-center gap-0.5 text-red-600 dark:text-red-400">
                        <svg width="12" height="14" viewBox="0 0 24 27" aria-hidden="true">
                          <path d={DELTA_ARROW_PATH} fill="currentColor" />
                        </svg>
                        {Math.abs(team.rankDelta)}
                      </span>
                    )}
                    {(team.rankDelta === null || team.rankDelta === 0) && (
                      <span className="text-text-muted">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Link
        to="/rankings"
        className="block px-4 sm:px-6 py-3 text-sm font-medium text-accent hover:text-accent-hover hover:bg-surface-alt text-center border-t border-border transition-colors"
      >
        View Full Rankings &rarr;
      </Link>
    </div>
  );
}
