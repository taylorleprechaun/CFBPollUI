import { Link } from 'react-router-dom';

import type { TrackRecordWeek } from '../../schemas';

import { formatMarginBias, formatMarginRMSE, formatTotals } from '../../lib/track-record-utils';
import { getWeekLabel } from '../../lib/week-utils';
import { FactRow } from '../predictions/prediction-card';

interface TrackRecordWeekCardProps {
  week: TrackRecordWeek;
}

export function TrackRecordWeekCard({ week }: TrackRecordWeekCardProps) {
  return (
    <div className="bg-surface border border-border rounded-xl divide-y divide-border">
      <div className="px-4 py-2">
        <Link
          to={`/predictions?season=${week.season}&week=${week.week}`}
          className="font-medium hover:text-accent hover:underline"
        >
          {week.season} {getWeekLabel(week.week)}
        </Link>
      </div>

      <FactRow label="Winner" value={formatTotals(week.winner)} />
      <FactRow label="Spread" value={formatTotals(week.spread)} />
      <FactRow label="O/U" value={formatTotals(week.overUnder)} />
      <FactRow label="Margin RMSE" value={formatMarginRMSE(week.marginRMSE)} />
      <FactRow label="Margin Bias" value={formatMarginBias(week.marginBias)} />
    </div>
  );
}
