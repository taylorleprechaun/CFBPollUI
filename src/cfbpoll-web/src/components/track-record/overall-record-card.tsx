import type { TrackRecordTotals } from '../../schemas';

import { formatTotals, winPercentage } from '../../lib/track-record-utils';

interface OverallRecordCardProps {
  label: string;
  totals: TrackRecordTotals;
}

export function OverallRecordCard({ label, totals }: OverallRecordCardProps) {
  const pct = winPercentage(totals);

  return (
    <div className="bg-surface border border-border rounded-xl p-4 sm:p-6 text-center">
      <div className="text-sm font-medium text-text-muted uppercase tracking-wider mb-2">{label}</div>
      <div className="text-3xl font-bold text-text-primary">{formatTotals(totals)}</div>
      {pct !== null && (
        <div className="text-sm text-text-muted mt-1">{pct.toFixed(1)}%</div>
      )}
    </div>
  );
}
