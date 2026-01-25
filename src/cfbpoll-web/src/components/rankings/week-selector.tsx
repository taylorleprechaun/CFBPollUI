import type { Week } from '../../types';

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
  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="week-select" className="font-medium text-gray-700">
        Week:
      </label>
      <select
        id="week-select"
        value={selectedWeek ?? ''}
        onChange={(e) => onWeekChange(Number(e.target.value))}
        disabled={isLoading || weeks.length === 0}
        className="block w-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
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
