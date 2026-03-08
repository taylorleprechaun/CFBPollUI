import { useId } from 'react';
import type { Week } from '../../types';
import { BUTTON_PRIMARY, SELECT_BASE } from '../ui/button-styles';

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
    <div className="bg-surface border border-border rounded-xl p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-text-primary mb-4">Calculate Rankings</h2>
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label htmlFor={seasonId} className="block text-sm font-medium text-text-secondary mb-1">
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
            className={`px-3 py-2 ${SELECT_BASE}`}
          >
            {seasons.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={weekId} className="block text-sm font-medium text-text-secondary mb-1">
            Week
          </label>
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
        <button
          onClick={onCalculate}
          disabled={isCalculating || selectedSeason === null || selectedWeek === null}
          className={BUTTON_PRIMARY}
        >
          {isCalculating ? 'Calculating...' : 'Calculate'}
        </button>
      </div>
    </div>
  );
}
