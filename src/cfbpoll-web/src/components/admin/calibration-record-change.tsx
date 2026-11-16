import type { TrackRecordTotals } from '../../schemas';

import { badgeColorClasses } from '../../lib/badge-colors';
import { formatRecordChange, formatSignedNumber, recordDifference } from '../../lib/calibration-utils';

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
  const difference = recordDifference(used, compared);
  const tone = badgeColorClasses(difference > 0 ? 'green' : difference < 0 ? 'red' : 'gray');

  return (
    <div className={`flex flex-col gap-0.5 ${align === 'end' ? 'items-end' : 'items-start'}`}>
      <span className={`${PILL_CLASSES} ${tone}`}>{formatSignedNumber(difference)}</span>
      <span className="text-xs text-text-muted tabular-nums whitespace-nowrap">{formatRecordChange(used, compared)}</span>
    </div>
  );
}
