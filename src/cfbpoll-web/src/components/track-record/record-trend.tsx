import type { RecordTrendSummary } from '../../lib/track-record-utils';

import { TrendDownIcon, TrendFlatIcon, TrendUpIcon } from '../ui/icons';

const DIRECTION_ICONS: Record<RecordTrendSummary['direction'], () => React.JSX.Element> = {
  down: TrendDownIcon,
  flat: TrendFlatIcon,
  up: TrendUpIcon,
};

const DIRECTION_CLASSES: Record<RecordTrendSummary['direction'], string> = {
  down: 'text-red-600 dark:text-red-400',
  flat: 'text-text-muted',
  up: 'text-green-600 dark:text-green-400',
};

const DIRECTION_WORDS: Record<RecordTrendSummary['direction'], string> = {
  down: 'Down from',
  flat: 'Even with',
  up: 'Up from',
};

interface RecordTrendProps {
  trend: RecordTrendSummary;
  windowWeeks: number;
}

export function RecordTrend({ trend, windowWeeks }: RecordTrendProps) {
  const Icon = DIRECTION_ICONS[trend.direction];

  return (
    <div className="flex items-center justify-center gap-1 text-xs text-text-muted mt-2" title={`Last ${windowWeeks} published weeks`}>
      <span>L{windowWeeks}: {trend.windowPct.toFixed(1)}%</span>
      <span className={DIRECTION_CLASSES[trend.direction]}>
        <Icon />
      </span>
      <span className="sr-only">
        {DIRECTION_WORDS[trend.direction]} {trend.baselinePct.toFixed(1)}% all-time
      </span>
    </div>
  );
}
