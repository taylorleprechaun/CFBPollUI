import { formatTotals } from '../../lib/track-record-utils';
import { getWeekLabel } from '../../lib/week-utils';
import { TableSkeleton } from '../ui/table-skeleton';
import type { TrackRecordWeek } from '../../schemas';

const COLUMN_COUNT = 4;

interface TrackRecordTableProps {
  isLoading?: boolean;
  weeks: TrackRecordWeek[];
}

export function TrackRecordTable({ isLoading = false, weeks }: TrackRecordTableProps) {
  if (isLoading) {
    return <TableSkeleton columns={COLUMN_COUNT} />;
  }

  return (
    <table className="min-w-full divide-y divide-border">
      <thead className="bg-surface-alt">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Week</th>
          <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Winner</th>
          <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Spread</th>
          <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">O/U</th>
        </tr>
      </thead>
      <tbody className="bg-surface divide-y divide-border">
        {weeks.map((w) => (
          <tr key={`${w.season}-${w.week}`} className="even:bg-surface-alt/50">
            <td className="px-4 py-3 text-sm text-text-primary">
              {w.season} {getWeekLabel(w.week)}
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
          </tr>
        ))}
      </tbody>
    </table>
  );
}
