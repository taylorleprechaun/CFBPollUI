import type { PredictionRecordSummary } from '../../schemas/admin';

import { formatMarginBias, formatMarginRMSE } from '../../lib/track-record-utils';
import { MarginStatCard } from '../track-record/margin-stat-card';
import { OverallRecordCard } from '../track-record/overall-record-card';

interface ExperimentalPredictionsSummarySectionProps {
  summary: PredictionRecordSummary;
}

export function ExperimentalPredictionsSummarySection({ summary }: ExperimentalPredictionsSummarySectionProps) {
  if (summary.gradedGameCount === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-4 sm:p-6 text-center text-text-muted">
        This week hasn't been played yet - no actual results to grade against.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <OverallRecordCard label="Winner" totals={summary.winner} />
        <OverallRecordCard label="Spread" totals={summary.spread} />
        <OverallRecordCard label="Over/Under" totals={summary.overUnder} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MarginStatCard label="Margin Bias" value={formatMarginBias(summary.marginBias)} />
        <MarginStatCard label="Margin MAE" value={formatMarginRMSE(summary.marginMAE)} />
        <MarginStatCard label="Margin RMSE" value={formatMarginRMSE(summary.marginRMSE)} />
      </div>
    </div>
  );
}
