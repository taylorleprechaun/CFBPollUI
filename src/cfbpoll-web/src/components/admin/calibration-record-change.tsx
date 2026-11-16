import type { TrackRecordTotals } from '../../schemas';

import { formatRecordChange } from '../../lib/calibration-utils';

interface CalibrationRecordChangeProps {
  align?: 'end' | 'start';
  compared: TrackRecordTotals;
  used: TrackRecordTotals;
}

const PILL_CLASSES = 'inline-block min-w-10 rounded-full px-2 py-0.5 text-center text-sm font-semibold tabular-nums';

/**
 * How many more (or fewer) picks were correct with the compared values than with the values used, as a
 * colored badge, with both records underneath.
 */
export function CalibrationRecordChange({ align = 'end', compared, used }: CalibrationRecordChangeProps) {
  const difference = compared.correct - used.correct;
  const tone = difference > 0
    ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
    : difference < 0
      ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
      : 'bg-surface-alt text-text-muted';

  return (
    <div className={`flex flex-col gap-0.5 ${align === 'end' ? 'items-end' : 'items-start'}`}>
      <span className={`${PILL_CLASSES} ${tone}`}>{difference > 0 ? `+${difference}` : difference}</span>
      <span className="text-xs text-text-muted tabular-nums whitespace-nowrap">{formatRecordChange(used, compared)}</span>
    </div>
  );
}
