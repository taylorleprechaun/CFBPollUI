import type { TrackRecordStatInfo } from '../../lib/track-record-stat-info';
import type { TrackRecordTotals } from '../../schemas';

import { formatTotals, winPercentage } from '../../lib/track-record-utils';
import { InfoTooltip } from '../ui/info-tooltip';

interface OverallRecordCardProps {
  label: string;
  statInfo?: TrackRecordStatInfo;
  totals: TrackRecordTotals;
}

export function OverallRecordCard({ label, statInfo, totals }: OverallRecordCardProps) {
  const pct = winPercentage(totals);

  return (
    <div className="bg-surface border border-border rounded-xl p-4 sm:p-6 text-center">
      <div className="flex items-center justify-center gap-1.5 text-sm font-medium text-text-muted uppercase tracking-wider mb-2">
        <span>{label}</span>
        {statInfo && <InfoTooltip statName={label} summary={statInfo.shortSummary} anchor={statInfo.id} />}
      </div>
      <div className="text-3xl font-bold text-text-primary">{formatTotals(totals)}</div>
      {pct !== null && (
        <div className="text-sm text-text-muted mt-1">{pct.toFixed(1)}%</div>
      )}
    </div>
  );
}
