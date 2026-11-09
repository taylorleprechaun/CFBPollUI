import type { GamePredictionPublic } from '../../schemas';

import { formatOverUnder, formatSpread } from '../../lib/prediction-format-utils';
import { GradedPick } from '../predictions/graded-pick';
import { FactRow } from '../predictions/prediction-card';
import { WinnerPill } from '../predictions/winner-pill';

interface PredictionsComparisonColumnProps {
  prediction: GamePredictionPublic | undefined;
  showMissingLines?: boolean;
}

export function PredictionsComparisonColumn({ prediction, showMissingLines = true }: PredictionsComparisonColumnProps) {
  if (!prediction) {
    return (
      <div className="h-full bg-surface border border-border rounded-xl p-4 text-sm text-text-muted flex items-center justify-center">
        No data
      </div>
    );
  }

  const isSpreadVisible = showMissingLines || prediction.bettingSpread !== null;
  const isOverUnderVisible = showMissingLines || prediction.bettingOverUnder !== null;

  return (
    <div className="h-full bg-surface border border-border rounded-xl divide-y divide-border">
      <FactRow label="Score" value={`${prediction.awayTeamScore}-${prediction.homeTeamScore}`} />
      <FactRow label="Winner" value={<WinnerPill prediction={prediction} showGrades />} />
      {isSpreadVisible && (
        <FactRow
          label="Spread"
          value={formatSpread(prediction)}
          secondary={<GradedPick grade={prediction.spreadGrade} pick={prediction.mySpreadPick} />}
        />
      )}
      {isOverUnderVisible && (
        <FactRow
          label="O/U"
          value={formatOverUnder(prediction.bettingOverUnder)}
          secondary={<GradedPick grade={prediction.overUnderGrade} pick={prediction.myOverUnderPick} />}
        />
      )}
    </div>
  );
}
