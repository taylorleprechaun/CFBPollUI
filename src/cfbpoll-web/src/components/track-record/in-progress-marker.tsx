import type { TrackRecordWeek } from '../../schemas';

import { isWeekInProgress } from '../../lib/track-record-utils';

interface InProgressMarkerProps {
  week: Pick<TrackRecordWeek, 'gameCount' | 'marginGameCount'>;
}

export function InProgressMarker({ week }: InProgressMarkerProps) {
  if (!isWeekInProgress(week)) return null;

  const label = `In progress: ${week.marginGameCount} of ${week.gameCount} games graded`;

  return (
    <span aria-label={label} className="ml-0.5 text-text-muted" title={label}>
      *
    </span>
  );
}
