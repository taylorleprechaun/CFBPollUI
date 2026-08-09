import { Link } from 'react-router-dom';

import type { TrackRecordWeek } from '../../schemas';

import { marginBiasClasses, marginRMSEClasses } from '../../lib/margin-quality';
import { overUnderClasses, spreadClasses, winnerClasses } from '../../lib/pick-quality';
import { formatMarginBias, formatMarginRMSE, formatTotals } from '../../lib/track-record-utils';
import { getWeekLabel } from '../../lib/week-utils';
import { FactRow } from '../predictions/prediction-card';
import { ValueBadge } from '../ui/value-badge';

interface TrackRecordWeekCardProps {
  showMarginStats?: boolean;
  week: TrackRecordWeek;
}

export function TrackRecordWeekCard({ showMarginStats = false, week }: TrackRecordWeekCardProps) {
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

      <FactRow label="Winner" value={<ValueBadge classes={winnerClasses(week.winner)} value={formatTotals(week.winner)} />} />
      <FactRow label="Spread" value={<ValueBadge classes={spreadClasses(week.spread)} value={formatTotals(week.spread)} />} />
      <FactRow label="O/U" value={<ValueBadge classes={overUnderClasses(week.overUnder)} value={formatTotals(week.overUnder)} />} />
      {showMarginStats && (
        <>
          <FactRow
            label="Margin RMSE"
            value={<ValueBadge classes={marginRMSEClasses(week.marginRMSE)} value={formatMarginRMSE(week.marginRMSE)} />}
          />
          <FactRow
            label="Margin Bias"
            value={<ValueBadge classes={marginBiasClasses(week.marginBias)} value={formatMarginBias(week.marginBias)} />}
          />
        </>
      )}
    </div>
  );
}
