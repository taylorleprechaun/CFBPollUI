import { useId } from 'react';
import type { Week } from '../../types';

interface CalculateSectionProps {
  isCalculating: boolean;
  onCalculate: () => void;
  onSeasonChange: (season: number) => void;
  onWeekChange: (week: number | null) => void;
  seasons: number[];
  seasonsLoading: boolean;
  selectedSeason: number | null;
  selectedWeek: number | null;
  weeks: Week[];
  weeksLoading: boolean;
}

export function CalculateSection({
  isCalculating,
  onCalculate,
  onSeasonChange,
  onWeekChange,
  seasons,
  seasonsLoading,
  selectedSeason,
  selectedWeek,
  weeks,
  weeksLoading,
}: CalculateSectionProps) {
  const seasonId = useId();
  const weekId = useId();

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Calculate Rankings</h2>
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label htmlFor={seasonId} className="block text-sm font-medium text-gray-700 mb-1">
            Season
          </label>
          <select
            id={seasonId}
            value={selectedSeason ?? ''}
            onChange={(e) => {
              onSeasonChange(Number(e.target.value));
              onWeekChange(null);
            }}
            disabled={seasonsLoading}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            {seasons.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={weekId} className="block text-sm font-medium text-gray-700 mb-1">
            Week
          </label>
          <select
            id={weekId}
            value={selectedWeek ?? ''}
            onChange={(e) => onWeekChange(Number(e.target.value))}
            disabled={weeksLoading}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            {weeks.map((w) => (
              <option key={w.weekNumber} value={w.weekNumber}>{w.label}</option>
            ))}
          </select>
        </div>
        <button
          onClick={onCalculate}
          disabled={isCalculating || selectedSeason === null || selectedWeek === null}
          className="bg-blue-900 text-white px-4 py-2 rounded-md hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCalculating ? 'Calculating...' : 'Calculate'}
        </button>
      </div>
    </div>
  );
}
