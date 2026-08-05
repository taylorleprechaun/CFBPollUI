import { useId } from 'react';
import type { Week } from '../../types';
import { BUTTON_PRIMARY, BUTTON_SECONDARY, SELECT_BASE } from '../ui/button-styles';
import { FeedbackIndicator } from './feedback-indicator';
import type { ActionFeedback } from './types';

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
  const seasonId = useId();
  const weekId = useId();
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
          {isCalculating ? buttonPendingLabel : buttonLabel}
        </button>
      </div>
    </div>
  );
}
