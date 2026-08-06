import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useRankings } from '../hooks/use-rankings';
import { usePredictionSeasons } from '../hooks/use-prediction-seasons';
import { useSeason } from '../hooks/use-season';
import { useWeeks } from '../hooks/use-weeks';
import { useDocumentTitle } from '../hooks/use-document-title';
import { usePublicPredictions } from '../hooks/use-public-predictions';
import { useWeekSelection } from '../hooks/use-week-selection';
import { ErrorAlert } from '../components/error';
import { PredictionsTable } from '../components/predictions/predictions-table';
import { SeasonSelector } from '../components/rankings/season-selector';
import { WeekSelector } from '../components/rankings/week-selector';
import { ApiError } from '../lib/api-error';
import { getWeekLabel } from '../lib/week-utils';

export function PublicPredictionsPage() {
  useDocumentTitle('Taylor Steinberg - Predictions');

  const [searchParams] = useSearchParams();
  const initialSeasonApplied = useRef(false);
  const initialWeekApplied = useRef(false);

  const {
    seasons,
    selectedSeason,
    setSelectedSeason,
  } = useSeason();

  const {
    data: predictionSeasonsData,
    isLoading: predictionSeasonsLoading,
    error: predictionSeasonsError,
    refetch: refetchPredictionSeasons,
  } = usePredictionSeasons();

  const predictionSeasons = predictionSeasonsData?.seasons ?? [];

  const effectiveSeason = predictionSeasons.includes(selectedSeason ?? -1)
    ? selectedSeason
    : predictionSeasons[0] ?? null;

  const {
    data: weeksData,
    isLoading: weeksLoading,
    error: weeksError,
    refetch: refetchWeeks,
  } = useWeeks(effectiveSeason);

  const publishedWeeks = useMemo(
    () => weeksData?.weeks?.filter((w) => w.predictionsPublished) ?? [],
    [weeksData?.weeks]
  );

  const { selectedWeek, setSelectedWeek } = useWeekSelection(publishedWeeks);

  const maxSeason = seasons.length > 0 ? seasons[0] : null;

  const {
    data: predictionsData,
    isLoading: predictionsLoading,
    error: predictionsError,
    refetch: refetchPredictions,
  } = usePublicPredictions(effectiveSeason, selectedWeek, maxSeason);

  const { data: rankingsData } = useRankings(effectiveSeason, selectedWeek, maxSeason);

  const rankByTeam = useMemo(
    () => new Map(rankingsData?.rankings.map((r) => [r.teamName.toLowerCase(), r.rank]) ?? []),
    [rankingsData]
  );

  const [top25Only, setTop25Only] = useState(false);

  const displayedPredictions = useMemo(() => {
    const predictions = predictionsData?.predictions ?? [];
    if (!top25Only) return predictions;

    return predictions.filter((p) => {
      const awayRank = rankByTeam.get(p.awayTeam.toLowerCase()) ?? Infinity;
      const homeRank = rankByTeam.get(p.homeTeam.toLowerCase()) ?? Infinity;
      return awayRank <= 25 || homeRank <= 25;
    });
  }, [predictionsData?.predictions, top25Only, rankByTeam]);

  useEffect(() => {
    if (initialSeasonApplied.current) return;
    const param = searchParams.get('season');
    if (param) {
      const parsed = Number(param);
      if (!Number.isNaN(parsed) && parsed !== selectedSeason) {
        setSelectedSeason(parsed);
      }
    }
    initialSeasonApplied.current = true;
  }, [searchParams, selectedSeason, setSelectedSeason]);

  useEffect(() => {
    if (initialWeekApplied.current || publishedWeeks.length === 0) return;
    const param = searchParams.get('week');
    if (param) {
      const parsed = Number(param);
      if (publishedWeeks.some((w) => w.weekNumber === parsed)) {
        setSelectedWeek(parsed);
      }
    }
    initialWeekApplied.current = true;
  }, [searchParams, publishedWeeks, setSelectedWeek]);

  const handleSeasonChange = (season: number) => {
    setSelectedSeason(season);
    setSelectedWeek(null);
  };

  const showTop25Empty = top25Only && !predictionsLoading && predictionsData !== undefined && displayedPredictions.length === 0;

  const isNotFound = predictionsError instanceof ApiError && predictionsError.statusCode === 404;
  const error = predictionSeasonsError || weeksError || (isNotFound ? null : predictionsError);
  const handleRetry = () => {
    if (predictionSeasonsError) refetchPredictionSeasons();
    if (weeksError) refetchWeeks();
    if (predictionsError) refetchPredictions();
  };

  return (
    <div className="space-y-6">
      <div className="bg-surface border border-border rounded-xl p-4 sm:p-6">
        <h1 className="text-2xl font-bold text-text-primary mb-4">Predictions</h1>
        <div className="flex flex-wrap gap-4">
          <SeasonSelector
            seasons={predictionSeasons}
            selectedSeason={effectiveSeason}
            onSeasonChange={handleSeasonChange}
            isLoading={predictionSeasonsLoading}
          />
          <WeekSelector
            weeks={publishedWeeks}
            selectedWeek={selectedWeek}
            onWeekChange={setSelectedWeek}
            isLoading={weeksLoading}
          />
          <button
            type="button"
            aria-pressed={top25Only}
            onClick={() => setTop25Only((prev) => !prev)}
            className={`px-3 py-1 text-sm font-medium rounded-full transition-colors duration-150 ${
              top25Only
                ? 'bg-accent text-white shadow-sm'
                : 'bg-surface-alt text-text-secondary hover:bg-surface-elevated border border-border'
            }`}
          >
            Top 25
          </button>
        </div>
      </div>

      {error && (
        <ErrorAlert error={error} onRetry={handleRetry} />
      )}

      {!error && publishedWeeks.length === 0 && !weeksLoading && (
        <div className="bg-surface border border-border rounded-xl p-6 text-center text-text-muted">
          No predictions have been published for this season yet.
        </div>
      )}

      {!error && publishedWeeks.length > 0 && isNotFound && !predictionsLoading && (
        <div className="bg-surface border border-border rounded-xl p-6 text-center text-text-muted">
          No predictions have been published for this week yet.
        </div>
      )}

      {!error && !isNotFound && showTop25Empty && (
        <div className="bg-surface border border-border rounded-xl p-6 text-center text-text-muted">
          No Top 25 matchups this week.
        </div>
      )}

      {!error && !isNotFound && !showTop25Empty && (predictionsLoading || predictionsData) && (
        <div className="bg-surface shadow-md rounded-xl overflow-hidden animate-fade-in">
          <PredictionsTable
            predictions={displayedPredictions}
            isLoading={predictionsLoading}
            rankByTeam={rankByTeam}
            season={effectiveSeason}
            showGrades={predictionsData?.resultsPublished ?? false}
          />
        </div>
      )}

      {predictionsData && (
        <div className="text-sm text-text-muted text-center">
          Showing predictions for {predictionsData.season} Season,{' '}
          {weeksData?.weeks?.find((w) => w.weekNumber === predictionsData.week)?.label ??
            getWeekLabel(predictionsData.week)}
        </div>
      )}
    </div>
  );
}

export default PublicPredictionsPage;
