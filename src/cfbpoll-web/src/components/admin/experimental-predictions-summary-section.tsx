import type { PredictionRecordSummary } from '../../schemas/admin';

import { marginBiasClasses, marginRMSEClasses } from '../../lib/margin-quality';
import { overUnderClasses, spreadClasses, winnerClasses } from '../../lib/pick-quality';
import { formatMarginBias, formatMarginRMSE, formatTotals, winPercentage } from '../../lib/track-record-utils';
import { FactRow } from '../predictions/prediction-card';
import { ValueBadge } from '../ui/value-badge';

interface ExperimentalPredictionsSummarySectionProps {
  summary: PredictionRecordSummary;
}

export function ExperimentalPredictionsSummarySection({ summary }: ExperimentalPredictionsSummarySectionProps) {
  if (summary.gradedGameCount === 0) {
    return (
      <div className="h-full bg-surface border border-border rounded-xl p-4 flex items-center justify-center text-center text-sm text-text-muted">
        This week hasn't been played yet - no actual results to grade against.
      </div>
    );
  }

  const winnerPct = winPercentage(summary.winner);
  const spreadPct = winPercentage(summary.spread);
  const overUnderPct = winPercentage(summary.overUnder);

  return (
    <div className="h-full bg-surface border border-border rounded-xl divide-y divide-border">
      <FactRow
        label="Winner"
        value={formatTotals(summary.winner)}
        secondary={winnerPct !== null ? <ValueBadge classes={winnerClasses(summary.winner)} value={`${winnerPct.toFixed(1)}%`} /> : null}
      />
      <FactRow
        label="Spread"
        value={formatTotals(summary.spread)}
        secondary={spreadPct !== null ? <ValueBadge classes={spreadClasses(summary.spread)} value={`${spreadPct.toFixed(1)}%`} /> : null}
      />
      <FactRow
        label="O/U"
        value={formatTotals(summary.overUnder)}
        secondary={overUnderPct !== null ? <ValueBadge classes={overUnderClasses(summary.overUnder)} value={`${overUnderPct.toFixed(1)}%`} /> : null}
      />
      <FactRow
        label="Margin Bias"
        value={<ValueBadge classes={marginBiasClasses(summary.marginBias)} value={formatMarginBias(summary.marginBias)} />}
      />
      <FactRow label="Margin MAE" value={formatMarginRMSE(summary.marginMAE)} />
      <FactRow
        label="Margin RMSE"
        value={<ValueBadge classes={marginRMSEClasses(summary.marginRMSE)} value={formatMarginRMSE(summary.marginRMSE)} />}
      />
    </div>
  );
}
