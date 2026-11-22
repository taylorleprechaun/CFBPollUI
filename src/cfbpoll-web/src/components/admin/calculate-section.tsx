import type { Week } from '../../types';
import type { ActionFeedback } from './types';

import { BUTTON_PRIMARY, BUTTON_SECONDARY } from '../ui/button-styles';
import { FeedbackIndicator } from './feedback-indicator';
import { SeasonWeekSelect } from './season-week-select';

interface CalculateSectionProps {
  buttonLabel?: string;
  buttonPendingLabel?: string;
  isCalculating: boolean;
  isRefreshingCache?: boolean;
  onCalculate: () => void;
  onClearRefreshFeedback?: () => void;
  onRefreshCache?: () => void;
  onSeasonChange: (season: number) => void;
  onWeekChange: (week: number | null) => void;
  refreshFeedback?: ActionFeedback | null;
  seasons: number[];
  seasonsLoading: boolean;
  selectedSeason: number | null;
  selectedWeek: number | null;
  title?: string;
  weeks: Week[];
  weeksLoading: boolean;
}

export function CalculateSection({
  buttonLabel = 'Calculate',
  buttonPendingLabel = 'Calculating...',
  isCalculating,
  isRefreshingCache = false,
  onCalculate,
  onClearRefreshFeedback,
  onRefreshCache,
  onSeasonChange,
  onWeekChange,
  refreshFeedback,
  seasons,
  seasonsLoading,
  selectedSeason,
  selectedWeek,
  title = 'Calculate Rankings',
  weeks,
  weeksLoading,
}: CalculateSectionProps) {
  const refreshFeedbackKey = `refresh-cache-${selectedSeason}-${selectedWeek}`;

  return (
    <div className="bg-surface border border-border rounded-xl p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
        {onRefreshCache && (
          <div className="flex items-center gap-2">
            <button
              onClick={onRefreshCache}
              disabled={isRefreshingCache || selectedSeason === null || selectedWeek === null}
              className={BUTTON_SECONDARY}
            >
              {isRefreshingCache ? 'Refreshing...' : 'Refresh Cached Data'}
            </button>
            <FeedbackIndicator
              feedback={refreshFeedback ?? null}
              feedbackKey={refreshFeedbackKey}
              onClear={() => onClearRefreshFeedback?.()}
            />
          </div>
        )}
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
        <button
          onClick={onCalculate}
          disabled={isCalculating || selectedSeason === null || selectedWeek === null}
          className={BUTTON_PRIMARY}
        >
          {isCalculating ? buttonPendingLabel : buttonLabel}
        </button>
      </SeasonWeekSelect>
    </div>
  );
}
