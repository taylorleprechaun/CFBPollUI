import type { AlgorithmRunEntry } from '../../hooks/use-algorithm-run-state';
import type { ExperimentalMatchupResponse } from '../../schemas/admin';

import { ErrorAlert } from '../error';
import { PredictionsComparisonColumn } from './predictions-comparison-column';

interface MatchupVersionResultProps {
  entry: AlgorithmRunEntry<ExperimentalMatchupResponse>;
}

const PLACEHOLDER_CLASS =
  'h-full bg-surface border border-border rounded-xl p-4 text-sm text-text-muted flex flex-col items-center justify-center gap-1 text-center';

export function MatchupVersionResult({ entry }: MatchupVersionResultProps) {
  if (entry.status === 'pending') {
    return <div className={PLACEHOLDER_CLASS}>Calculating…</div>;
  }

  if (entry.status === 'error') {
    return <ErrorAlert error={entry.error ?? new Error('Calculation failed')} />;
  }

  if (entry.status !== 'success' || entry.result === null) return null;

  if (entry.result.prediction === null) {
    return (
      <div className={PLACEHOLDER_CLASS}>
        <span className="font-medium text-text-secondary">Insufficient data</span>
        <span>This version does not have enough data on one of these teams yet.</span>
      </div>
    );
  }

  return <PredictionsComparisonColumn prediction={entry.result.prediction} showMissingLines={false} />;
}
