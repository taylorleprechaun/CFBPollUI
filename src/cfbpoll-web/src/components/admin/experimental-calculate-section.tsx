import type { Week } from '../../types';
import type { AlgorithmVersion } from './algorithm-versions';

import { BUTTON_PRIMARY } from '../ui/button-styles';
import { AlgorithmVersionPicker } from './algorithm-version-picker';
import { SeasonWeekSelect } from './season-week-select';

interface ExperimentalCalculateSectionProps {
  isRunning: boolean;
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

export function ExperimentalCalculateSection({
  isRunning,
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
}: ExperimentalCalculateSectionProps) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 className="text-lg font-semibold text-text-primary">Experimental Calculation</h2>
      </div>
      <SeasonWeekSelect
        onSeasonChange={onSeasonChange}
        onWeekChange={onWeekChange}
        seasons={seasons}
        seasonsLoading={seasonsLoading}
        selectedSeason={selectedSeason}
        selectedWeek={selectedWeek}
        weeks={weeks}
        weeksLoading={weeksLoading}
      >
        <AlgorithmVersionPicker onChange={onSelectedVersionsChange} selectedVersions={selectedVersions} />
        <button
          onClick={onRun}
          disabled={isRunning || selectedSeason === null || selectedWeek === null || selectedVersions.length === 0}
          className={BUTTON_PRIMARY}
        >
          {isRunning ? 'Calculating...' : 'Calculate'}
        </button>
      </SeasonWeekSelect>
    </div>
  );
}
