import type { TrackRecordStatInfo } from '../../lib/track-record-stat-info';

import { InfoTooltip } from '../ui/info-tooltip';
import { MarginValueBadge } from './margin-value-badge';

interface MarginStatCardProps {
  classes?: string | null;
  label: string;
  statInfo?: TrackRecordStatInfo;
  value: string;
}

export function MarginStatCard({ classes = null, label, statInfo, value }: MarginStatCardProps) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 sm:p-6 text-center">
      <div className="flex items-center justify-center gap-1.5 text-sm font-medium text-text-muted uppercase tracking-wider mb-2">
        <span>{label}</span>
        {statInfo && <InfoTooltip statName={label} summary={statInfo.shortSummary} anchor={statInfo.id} />}
      </div>
      <div className="text-3xl font-bold text-text-primary">
        <MarginValueBadge classes={classes} value={value} />
      </div>
    </div>
  );
}
