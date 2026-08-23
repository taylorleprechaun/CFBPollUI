import { useId } from 'react';

import type { Week } from '../../types';

import { WEEK_GAP_TOOLTIP_SUMMARY } from '../../lib/week-gap-tooltip';
import { SELECT_BASE } from '../ui/button-styles';
import { InfoTooltip } from '../ui/info-tooltip';

interface WeekSelectProps {
  onWeekChange: (week: number | null) => void;
  selectedWeek: number | null;
  weeks: Week[];
  weeksLoading: boolean;
}

export function WeekSelect({ onWeekChange, selectedWeek, weeks, weeksLoading }: WeekSelectProps) {
  const weekId = useId();

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <label htmlFor={weekId} className="block text-sm font-medium text-text-secondary">
          Week
        </label>
        <InfoTooltip statName="Week scheduling gap" summary={WEEK_GAP_TOOLTIP_SUMMARY} />
      </div>
      <select
        id={weekId}
        value={selectedWeek ?? ''}
        onChange={(e) => onWeekChange(Number(e.target.value))}
        disabled={weeksLoading}
        className={`px-3 py-2 ${SELECT_BASE}`}
      >
        {weeks.map((w) => (
          <option key={w.weekNumber} value={w.weekNumber}>{w.label}</option>
        ))}
      </select>
    </div>
  );
}
