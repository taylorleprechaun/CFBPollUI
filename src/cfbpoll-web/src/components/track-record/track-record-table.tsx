import { Link } from 'react-router-dom';

import type { TrackRecordWeek } from '../../schemas';

import { formatMarginBias, formatMarginRMSE, formatTotals } from '../../lib/track-record-utils';
import { getWeekLabel } from '../../lib/week-utils';
import { TableSkeleton } from '../ui/table-skeleton';
import { TrackRecordWeekCard } from './track-record-week-card';

const COLUMN_COUNT = 6;

interface TrackRecordTableProps {
  isLoading?: boolean;
  weeks: TrackRecordWeek[];
}

export function TrackRecordTable({ isLoading = false, weeks }: TrackRecordTableProps) {
  if (isLoading) {
    return <TableSkeleton columns={COLUMN_COUNT} />;
  }

  return (
    <>
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-surface-alt">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Week</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Winner</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Spread</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">O/U</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Margin RMSE</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Margin Bias</th>
            </tr>
          </thead>
          <tbody className="bg-surface divide-y divide-border">
            {weeks.map((w) => (
              <tr key={`${w.season}-${w.week}`} className="even:bg-surface-alt/50">
                <td className="px-4 py-3 text-sm text-text-primary">
                  <Link
                    to={`/predictions?season=${w.season}&week=${w.week}`}
                    className="hover:text-accent hover:underline"
                  >
                    {w.season} {getWeekLabel(w.week)}
                  </Link>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary text-right">
                  {formatTotals(w.winner)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary text-right">
                  {formatTotals(w.spread)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary text-right">
                  {formatTotals(w.overUnder)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary text-right">
                  {formatMarginRMSE(w.marginRMSE)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary text-right">
                  {formatMarginBias(w.marginBias)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3 p-3">
        {weeks.map((w) => (
          <TrackRecordWeekCard key={`${w.season}-${w.week}`} week={w} />
        ))}
      </div>
    </>
  );
}
