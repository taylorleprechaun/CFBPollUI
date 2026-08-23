import { useId } from 'react';

import type { Week } from '../../types';
import type { AlgorithmVersion } from './algorithm-versions';

import { BUTTON_PRIMARY, BUTTON_SECONDARY, SELECT_BASE } from '../ui/button-styles';
import { AlgorithmVersionPicker } from './algorithm-version-picker';
import { WeekSelect } from './week-select';

interface ExperimentalPredictionsCalculateSectionProps {
  isRunning: boolean;
  onCompareSeasonClick: () => void;
  onRun: () => void;
  onSeasonChange: (season: number) => void;
  onSelectedVersionsChange: (versions: AlgorithmVersion[]) => void;
  onWeekChange: (week: number | null) => void;
  seasons: number[];
  seasonsLoading: boolean;
  selectedSeason: number | null;
  selectedVersions: AlgorithmVersion[];
  selectedWeek: number | null;
  weeks: Week[];
  weeksLoading: boolean;
}

export function ExperimentalPredictionsCalculateSection({
  isRunning,
  onCompareSeasonClick,
  onRun,
  onSeasonChange,
  onSelectedVersionsChange,
  onWeekChange,
  seasons,
  seasonsLoading,
  selectedSeason,
  selectedVersions,
  selectedWeek,
  weeks,
  weeksLoading,
}: ExperimentalPredictionsCalculateSectionProps) {
  const seasonId = useId();

  return (
    <div className="bg-surface border border-border rounded-xl p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 className="text-lg font-semibold text-text-primary">Experimental Predictions</h2>
      </div>
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
        <WeekSelect onWeekChange={onWeekChange} selectedWeek={selectedWeek} weeks={weeks} weeksLoading={weeksLoading} />
        <AlgorithmVersionPicker onChange={onSelectedVersionsChange} selectedVersions={selectedVersions} />
        <button
          onClick={onRun}
          disabled={isRunning || selectedSeason === null || selectedWeek === null || selectedVersions.length === 0}
          className={BUTTON_PRIMARY}
        >
          {isRunning ? 'Calculating...' : 'Calculate Predictions'}
        </button>
        <button
          onClick={onCompareSeasonClick}
          disabled={isRunning || selectedSeason === null || weeksLoading || weeks.length === 0 || selectedVersions.length === 0}
          className={BUTTON_SECONDARY}
        >
          Compare Season
        </button>
      </div>
    </div>
  );
}
