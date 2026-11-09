import type { AlgorithmRunState } from '../../hooks/use-algorithm-run-state';
import type { SubmittedMatchup } from '../../hooks/use-experimental-matchup-state';
import type { ExperimentalMatchupResponse } from '../../schemas/admin';

import { getWeekLabel } from '../../lib/week-utils';
import { AlgorithmRunStatusBadge } from './algorithm-run-status-badge';
import { ALGORITHM_VERSIONS } from './algorithm-versions';
import { MatchupSeasonMeetings } from './matchup-season-meetings';
import { MatchupVersionResult } from './matchup-version-result';

interface ExperimentalMatchupResultsProps {
  runState: AlgorithmRunState<ExperimentalMatchupResponse>;
  submittedMatchup: SubmittedMatchup | null;
}

export function ExperimentalMatchupResults({ runState, submittedMatchup }: ExperimentalMatchupResultsProps) {
  const runVersions = ALGORITHM_VERSIONS.filter((version) => runState[version].status !== 'idle');
  if (submittedMatchup === null || runVersions.length === 0) return null;

  const { awayTeam, homeTeam, neutralSite, season, week } = submittedMatchup;
  const actualGames = runVersions
    .map((version) => runState[version].result)
    .find((result) => result !== null)?.actualGames ?? [];

  return (
    <div className="bg-surface shadow-md rounded-xl overflow-hidden">
      <div className="p-6 border-b border-border flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">
            {awayTeam} {neutralSite ? 'vs' : 'at'} {homeTeam}
          </h2>
          <p className="text-sm text-text-muted">
            {season} {getWeekLabel(week)}
            {neutralSite ? ' · Neutral site' : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {runVersions.map((version) => (
            <AlgorithmRunStatusBadge key={version} status={runState[version].status} version={version} />
          ))}
        </div>
      </div>
      <div className="p-6 space-y-6">
        <div className="flex flex-wrap gap-4">
          {runVersions.map((version) => (
            <div key={version} className="flex-1 min-w-64">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">{version}</h3>
              <MatchupVersionResult entry={runState[version]} />
            </div>
          ))}
        </div>
        <MatchupSeasonMeetings games={actualGames} />
      </div>
    </div>
  );
}
