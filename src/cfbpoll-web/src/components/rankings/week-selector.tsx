import { useId } from 'react';
import type { Week } from '../../types';
import { SELECT_BASE } from '../ui/button-styles';

interface WeekSelectorProps {
  weeks: Week[];
  selectedWeek: number | null;
  onWeekChange: (week: number) => void;
  isLoading: boolean;
}

export function WeekSelector({
  weeks,
  selectedWeek,
  onWeekChange,
  isLoading,
}: WeekSelectorProps) {
  const id = useId();

  return (
    <div className="flex items-center space-x-2">
      <label htmlFor={id} className="font-medium text-text-secondary">
        Week:
      </label>
      <select
        id={id}
        value={selectedWeek ?? ''}
        onChange={(e) => onWeekChange(Number(e.target.value))}
        disabled={isLoading || weeks.length === 0}
        className={`block w-40 ${SELECT_BASE}`}
      >
        {isLoading ? (
          <option>Loading...</option>
        ) : weeks.length === 0 ? (
          <option>Select a season</option>
        ) : (
          weeks.map((week) => (
            <option key={week.weekNumber} value={week.weekNumber}>
              {week.label}
            </option>
          ))
        )}
      </select>
    </div>
  );
}
