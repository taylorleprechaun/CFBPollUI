import { gradeClasses } from '../../lib/grade-classes';
import { formatOverUnder, formatPick, formatSpread } from '../../lib/prediction-format-utils';
import { TeamLogo } from '../rankings/team-logo';
import { GradedPick } from './graded-pick';
import { PredictionCard } from './prediction-card';
import { TeamNameLabel } from './team-name-label';
import { TableSkeleton } from '../ui/table-skeleton';
import type { GamePredictionPublic } from '../../schemas';

const COLUMN_COUNT = 6;

interface PredictionsTableProps {
  isLoading?: boolean;
  predictions: GamePredictionPublic[];
  rankByTeam?: Map<string, number>;
  season?: number | null;
  showGrades?: boolean;
}

export function PredictionsTable({ isLoading = false, predictions, rankByTeam, season = null, showGrades = false }: PredictionsTableProps) {
  if (isLoading) {
    return <TableSkeleton columns={COLUMN_COUNT} />;
  }

  return (
    <>
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-surface-alt">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Score</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Winner</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Spread</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Spread Pick</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">O/U</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">O/U Pick</th>
            </tr>
          </thead>
          <tbody className="bg-surface divide-y divide-border">
            {predictions.map((p) => (
              <tr key={`${p.awayTeam}-${p.homeTeam}`} className="even:bg-surface-alt/50">
                <td className="px-4 py-3 text-sm text-text-primary">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <TeamLogo logoURL={p.awayLogoURL} teamName={p.awayTeam} />
                      <TeamNameLabel teamName={p.awayTeam} season={season} rank={rankByTeam?.get(p.awayTeam.toLowerCase())} />
                      <span className="font-semibold ml-auto">{p.awayTeamScore}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TeamLogo logoURL={p.homeLogoURL} teamName={p.homeTeam} />
                      <TeamNameLabel teamName={p.homeTeam} season={season} rank={rankByTeam?.get(p.homeTeam.toLowerCase())} />
                      {p.neutralSite && <span className="text-text-muted text-xs">(N)</span>}
                      <span className="font-semibold ml-auto">{p.homeTeamScore}</span>
                    </div>
                    {showGrades && p.actualHomeScore !== null && p.actualAwayScore !== null && (
                      <span className="text-sm font-semibold text-text-primary">
                        Final: {p.actualAwayScore}-{p.actualHomeScore}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm font-medium text-text-primary align-middle">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <TeamLogo
                        logoURL={p.predictedWinner === p.homeTeam ? p.homeLogoURL : p.awayLogoURL}
                        teamName={p.predictedWinner}
                      />
                      <TeamNameLabel
                        className={showGrades ? `px-2 py-1 rounded-lg font-semibold ${gradeClasses(p.winnerGrade)}` : undefined}
                        teamName={p.predictedWinner}
                        season={season}
                        rank={rankByTeam?.get(p.predictedWinner.toLowerCase())}
                      />
                    </div>
                    {showGrades && p.winnerGrade === 'Incorrect' && p.actualWinner !== null && (
                      <span className="text-xs font-medium text-green-700 dark:text-green-400">Actual: {p.actualWinner}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary align-middle">
                  {formatSpread(p)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary align-middle">
                  {showGrades ? (
                    <GradedPick actualValue={p.actualSpreadCoveringTeam} grade={p.spreadGrade} pick={p.mySpreadPick} />
                  ) : (
                    formatPick(p.mySpreadPick)
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary text-right align-middle">
                  {formatOverUnder(p.bettingOverUnder)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary align-middle">
                  {showGrades ? (
                    <GradedPick actualValue={p.actualOverUnderResult} grade={p.overUnderGrade} pick={p.myOverUnderPick} />
                  ) : (
                    formatPick(p.myOverUnderPick)
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3 p-3">
        {predictions.map((p) => (
          <PredictionCard
            key={`${p.awayTeam}-${p.homeTeam}`}
            prediction={p}
            rankByTeam={rankByTeam}
            season={season}
            showGrades={showGrades}
          />
        ))}
      </div>
    </>
  );
}
