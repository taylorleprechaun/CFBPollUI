import { Link } from 'react-router-dom';

import type { ExperimentalCalculateResponse } from '../../schemas/admin';
import type { AlgorithmVersion } from './algorithm-versions';

import { TeamLogo } from '../rankings/team-logo';
import { RatingsComparisonColumnHeader } from './ratings-comparison-column-header';

export interface RatingsComparisonEntry {
  algorithmVersion: AlgorithmVersion;
  result: ExperimentalCalculateResponse;
}

interface RatingsComparisonTableProps {
  entries: RatingsComparisonEntry[];
  season: number;
  token: string | null;
  week: number;
}

export function RatingsComparisonTable({ entries, season, token, week }: RatingsComparisonTableProps) {
  const rowCount = Math.max(0, ...entries.map((entry) => entry.result.rankings.rankings.length));
  const rowIndices = Array.from({ length: rowCount }, (_, i) => i);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-surface-alt border-b-2 border-border">
          <tr>
            <th className="sticky left-0 z-10 bg-surface-alt px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
              Rank
            </th>
            {entries.map((entry) => (
              <th key={entry.algorithmVersion} className="px-4 py-3 text-left align-top">
                <RatingsComparisonColumnHeader
                  algorithmVersion={entry.algorithmVersion}
                  season={season}
                  token={token}
                  week={week}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rowIndices.map((rowIndex) => {
            const rowBgClass = rowIndex % 2 === 1 ? 'bg-surface-alt' : 'bg-surface';
            return (
              <tr key={rowIndex} className={`${rowBgClass} hover:bg-accent-light/50 transition-colors duration-150`}>
                <td className={`sticky left-0 z-10 ${rowBgClass} px-4 py-3 whitespace-nowrap text-sm font-medium text-text-primary`}>
                  {rowIndex + 1}
                </td>
                {entries.map((entry) => {
                  const team = entry.result.rankings.rankings[rowIndex];
                  return (
                    <td key={entry.algorithmVersion} className="px-4 py-3 whitespace-nowrap text-sm text-text-primary">
                      {team ? (
                        <div className="flex items-center space-x-3">
                          <TeamLogo logoURL={team.logoURL} teamName={team.teamName} />
                          <Link
                            to={`/team-details?team=${encodeURIComponent(team.teamName)}&season=${season}`}
                            className="font-medium hover:text-accent hover:underline"
                          >
                            {team.teamName}
                          </Link>
                          <span className="text-text-muted">{team.record}</span>
                          <span className="text-text-muted">({team.rating.toFixed(4)})</span>
                        </div>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
