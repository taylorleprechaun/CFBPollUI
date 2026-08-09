import { Link } from 'react-router-dom';

import type { TrackRecordWeek } from '../../schemas';

import { marginBiasClasses, marginRMSEClasses } from '../../lib/margin-quality';
import { formatMarginBias, formatMarginRMSE, formatTotals } from '../../lib/track-record-utils';
import { getWeekLabel } from '../../lib/week-utils';
import { FactRow } from '../predictions/prediction-card';
import { MarginValueBadge } from './margin-value-badge';

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

      <FactRow label="Winner" value={formatTotals(week.winner)} />
      <FactRow label="Spread" value={formatTotals(week.spread)} />
      <FactRow label="O/U" value={formatTotals(week.overUnder)} />
      {showMarginStats && (
        <>
          <FactRow
            label="Margin RMSE"
            value={<MarginValueBadge classes={marginRMSEClasses(week.marginRMSE)} value={formatMarginRMSE(week.marginRMSE)} />}
          />
          <FactRow
            label="Margin Bias"
            value={<MarginValueBadge classes={marginBiasClasses(week.marginBias)} value={formatMarginBias(week.marginBias)} />}
          />
        </>
      )}
    </div>
  );
}
