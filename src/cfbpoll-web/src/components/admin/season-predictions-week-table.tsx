import type { SeasonExperimentalPredictionsWeek } from '../../schemas/admin';

import { marginBiasClasses, marginRMSEClasses } from '../../lib/margin-quality';
import { overUnderClasses, spreadClasses, winnerClasses } from '../../lib/pick-quality';
import { formatMarginBias, formatMarginRMSE, formatTotals } from '../../lib/track-record-utils';
import { getWeekLabel } from '../../lib/week-utils';
import { ValueBadge } from '../ui/value-badge';

interface SeasonPredictionsWeekTableProps {
  weeks: SeasonExperimentalPredictionsWeek[];
}

export function SeasonPredictionsWeekTable({ weeks }: SeasonPredictionsWeekTableProps) {
  return (
    <div className="overflow-x-auto">
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
            <tr key={w.week} className="even:bg-surface-alt/50">
              <td className="px-4 py-3 whitespace-nowrap text-sm text-text-primary">{getWeekLabel(w.week)}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary text-right">
                <ValueBadge classes={winnerClasses(w.summary.winner)} value={formatTotals(w.summary.winner)} />
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary text-right">
                <ValueBadge classes={spreadClasses(w.summary.spread)} value={formatTotals(w.summary.spread)} />
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary text-right">
                <ValueBadge classes={overUnderClasses(w.summary.overUnder)} value={formatTotals(w.summary.overUnder)} />
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary text-right">
                <ValueBadge classes={marginRMSEClasses(w.summary.marginRMSE)} value={formatMarginRMSE(w.summary.marginRMSE)} />
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary text-right">
                <ValueBadge classes={marginBiasClasses(w.summary.marginBias)} value={formatMarginBias(w.summary.marginBias)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
