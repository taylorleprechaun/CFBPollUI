import { useId } from 'react';

import type { Week } from '../../types';

import { SELECT_BASE } from '../ui/button-styles';
import { WeekSelect } from './week-select';

interface SeasonWeekSelectProps {
  onSeasonChange: (season: number) => void;
  onWeekChange: (week: number | null) => void;
  seasons: number[];
  seasonsLoading: boolean;
  selectedSeason: number | null;
  selectedWeek: number | null;
  weeks: Week[];
  weeksLoading: boolean;
}

export function SeasonWeekSelect({
  onSeasonChange,
  onWeekChange,
  seasons,
  seasonsLoading,
  selectedSeason,
  selectedWeek,
  weeks,
  weeksLoading,
}: SeasonWeekSelectProps) {
  const seasonId = useId();

  return (
    <div className="flex flex-wrap gap-4 items-end">
      <div>
        <label htmlFor={seasonId} className="block text-sm font-medium text-text-secondary mb-1">
          Season
        </label>
        <select
          id={seasonId}
          value={selectedSeason ?? ''}
          onChange={(e) => onSeasonChange(Number(e.target.value))}
          disabled={seasonsLoading}
          className={`px-3 py-2 ${SELECT_BASE}`}
        >
          {seasons.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <WeekSelect onWeekChange={onWeekChange} selectedWeek={selectedWeek} weeks={weeks} weeksLoading={weeksLoading} />
    </div>
  );
}
