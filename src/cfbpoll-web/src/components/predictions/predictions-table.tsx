import type { GamePredictionPublic } from '../../schemas';

import { formatOverUnder, formatPick, formatSpread } from '../../lib/prediction-format-utils';
import { TableSkeleton } from '../ui/table-skeleton';
import { GradedPick } from './graded-pick';
import { PredictionCard } from './prediction-card';
import { PredictionScoreBlock } from './prediction-score-block';
import { WinnerPill } from './winner-pill';

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
                  <PredictionScoreBlock prediction={p} rankByTeam={rankByTeam} season={season} showGrades={showGrades} />
                </td>
                <td className="px-4 py-3 text-sm font-medium text-text-primary align-middle">
                  <WinnerPill prediction={p} rankByTeam={rankByTeam} season={season} showGrades={showGrades} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary align-middle">
                  {formatSpread(p)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary align-middle">
                  {showGrades ? (
                    <GradedPick grade={p.spreadGrade} pick={p.mySpreadPick} />
                  ) : (
                    formatPick(p.mySpreadPick)
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary text-right align-middle">
                  {formatOverUnder(p.bettingOverUnder)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary align-middle">
                  {showGrades ? (
                    <GradedPick grade={p.overUnderGrade} pick={p.myOverUnderPick} />
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
