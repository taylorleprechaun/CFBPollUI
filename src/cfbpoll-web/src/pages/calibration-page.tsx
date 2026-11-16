import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { PredictionCalibrationSection, SeasonWeekSelect } from '../components/admin';
import { ErrorAlert, ErrorBoundary } from '../components/error';
import { useAuth } from '../hooks/use-auth';
import { useDocumentTitle } from '../hooks/use-document-title';
import { useSeason } from '../hooks/use-season';
import { useWeekSelection } from '../hooks/use-week-selection';
import { useWeeks } from '../hooks/use-weeks';
import { SITE_OWNER_NAME } from '../lib/config';

export function CalibrationPage() {
  useDocumentTitle(`${SITE_OWNER_NAME} - Prediction Calibration`);

  const [searchParams, setSearchParams] = useSearchParams();

  const { token } = useAuth();
  const { nextSeason, seasons, seasonsLoading, selectedSeason: defaultSeason } = useSeason();

  const seasonOptions = useMemo(
    () => (nextSeason !== null ? [nextSeason, ...seasons] : seasons),
    [nextSeason, seasons]
  );

  // Season and week live in the URL so links from the Predictions page open a specific week.
  const season = parseIntegerParam(searchParams.get('season')) ?? defaultSeason;
  const { data: weeksData, isLoading: weeksLoading } = useWeeks(season);
  const { selectedWeek: defaultWeek } = useWeekSelection(weeksData?.weeks, 'latest-complete');
  const week = parseIntegerParam(searchParams.get('week')) ?? defaultWeek;

  function handleSeasonChange(newSeason: number) {
    setSearchParams({ season: String(newSeason) }, { replace: true });
  }

  function handleWeekChange(newWeek: number | null) {
    if (season === null || newWeek === null) return;
    setSearchParams({ season: String(season), week: String(newWeek) }, { replace: true });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Prediction Calibration</h1>

      <div className="bg-surface border border-border rounded-xl p-4 sm:p-6 space-y-4">
        <p className="text-sm text-text-secondary max-w-prose">
          Calibration values adjust a week’s predictions when they are generated. Compare the suggestion with the
          current values, check below how following the suggestions has done this season, then save. A week without
          its own values uses the most recent earlier week’s. Values lock once the week’s predictions are published.
        </p>
        <SeasonWeekSelect
          onSeasonChange={handleSeasonChange}
          onWeekChange={handleWeekChange}
          seasons={seasonOptions}
          seasonsLoading={seasonsLoading}
          selectedSeason={season}
          selectedWeek={week}
          weeks={weeksData?.weeks ?? []}
          weeksLoading={weeksLoading}
        />
      </div>

      {season !== null && week !== null && (
        <ErrorBoundary fallback={<ErrorAlert error={new Error('Failed to render prediction calibration')} />}>
          <PredictionCalibrationSection season={season} token={token} week={week} />
        </ErrorBoundary>
      )}
    </div>
  );
}

function parseIntegerParam(value: string | null): number | null {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

export default CalibrationPage;
