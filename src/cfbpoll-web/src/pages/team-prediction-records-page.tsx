import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { ErrorAlert } from '../components/error';
import {
  actualRecordColumn,
  createTeamNameColumn,
  deltaColumn,
  predictedRecordColumn,
} from '../components/predictions/team-prediction-record-columns';
import { SeasonSelector } from '../components/rankings/season-selector';
import { SortableTable } from '../components/ui/sortable-table';
import { useDocumentTitle } from '../hooks/use-document-title';
import { usePredictionSeasons } from '../hooks/use-prediction-seasons';
import { useTeamPredictionRecords } from '../hooks/use-team-prediction-records';

export function TeamPredictionRecordsPage() {
  useDocumentTitle('Taylor Steinberg - Team Prediction Records');

  const {
    data: predictionSeasonsData,
    isLoading: predictionSeasonsLoading,
    error: predictionSeasonsError,
    refetch: refetchPredictionSeasons,
  } = usePredictionSeasons();

  const predictionSeasons = predictionSeasonsData?.seasons ?? [];

  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedSeason, setSelectedSeasonState] = useState<number | null>(() => {
    const param = searchParams.get('season');
    if (!param) return null;
    const parsed = Number(param);
    return Number.isNaN(parsed) ? null : parsed;
  });

  const effectiveSeason = predictionSeasons.includes(selectedSeason ?? -1)
    ? selectedSeason
    : predictionSeasons[0] ?? null;

  const handleSeasonChange = (season: number) => {
    setSelectedSeasonState(season);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('season', String(season));
      return next;
    });
  };

  const {
    data: recordsData,
    isLoading: recordsLoading,
    error: recordsError,
    refetch: refetchRecords,
  } = useTeamPredictionRecords(effectiveSeason);

  const columns = useMemo(
    () => effectiveSeason !== null
      ? [createTeamNameColumn(effectiveSeason), predictedRecordColumn, actualRecordColumn, deltaColumn]
      : [],
    [effectiveSeason]
  );

  const error = predictionSeasonsError || recordsError;
  const handleRetry = () => {
    if (predictionSeasonsError) refetchPredictionSeasons();
    if (recordsError) refetchRecords();
  };

  return (
    <div className="space-y-6">
      <div className="bg-surface border border-border rounded-xl p-4 sm:p-6">
        <h1 className="text-2xl font-bold text-text-primary mb-4">Team Prediction Records</h1>
        <SeasonSelector
          seasons={predictionSeasons}
          selectedSeason={effectiveSeason}
          onSeasonChange={handleSeasonChange}
          isLoading={predictionSeasonsLoading}
        />
      </div>

      {error && (
        <ErrorAlert error={error} onRetry={handleRetry} />
      )}

      {!error && predictionSeasons.length === 0 && !predictionSeasonsLoading && (
        <div className="bg-surface border border-border rounded-xl p-6 text-center text-text-muted">
          No graded predictions have been published yet.
        </div>
      )}

      {!error && predictionSeasons.length > 0 && (
        <div className="bg-surface shadow-md rounded-xl overflow-hidden animate-fade-in">
          <SortableTable
            columns={columns}
            data={recordsData?.records ?? []}
            isLoading={recordsLoading}
            emptyMessage="No graded predictions have been published for this season yet."
          />
        </div>
      )}
    </div>
  );
}

export default TeamPredictionRecordsPage;
