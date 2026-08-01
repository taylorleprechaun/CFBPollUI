import { useSeason } from '../contexts/season-context';
import {
  CalculateSection,
  GradedResultsPreviewSection,
  GradePredictionsSection,
  PersistedPredictionsSection,
  PredictionsPreviewSection,
} from '../components/admin';
import { ErrorAlert, ErrorBoundary } from '../components/error';
import { ConfirmModal } from '../components/ui/confirm-modal';
import {
  useCalculatePredictions,
  useDeletePredictions,
  useGradePredictions,
  usePublishGradedResults,
  usePublishPredictions,
  useRefreshCache,
} from '../hooks/use-admin-mutations';
import { useAdminPageState } from '../hooks/use-admin-page-state';
import { useAuth } from '../contexts/auth-context';
import { useDocumentTitle } from '../hooks/use-document-title';
import { usePredictionsGradingState } from '../hooks/use-predictions-grading-state';
import { usePredictionsSummaries } from '../hooks/use-predictions-summaries';
import { useWeekSelection } from '../hooks/use-week-selection';
import { useWeeks } from '../hooks/use-weeks';
import { getWeekLabel } from '../lib/week-utils';
import type { CalculatePredictionsResponse } from '../schemas/admin';

export function PredictionsPage() {
  useDocumentTitle('Predictions - CFB Poll');

  const { token } = useAuth();

  const {
    seasons,
    seasonsLoading,
    selectedSeason,
    setSelectedSeason,
  } = useSeason();

  const { data: weeksData, isLoading: weeksLoading } = useWeeks(selectedSeason);
  const { selectedWeek, setSelectedWeek } = useWeekSelection(weeksData?.weeks);

  const {
    data: summaries,
    error: summariesError,
    refetch: refetchSummaries,
  } = usePredictionsSummaries(token);

  const calculateMutation = useCalculatePredictions(token);
  const publishMutation = usePublishPredictions(token);
  const deleteMutation = useDeletePredictions(token);
  const refreshCacheMutation = useRefreshCache(token);
  const gradeMutation = useGradePredictions(token);
  const publishResultsMutation = usePublishGradedResults(token);

  const {
    actionFeedback: gradingActionFeedback,
    clearFeedback: clearGradingFeedback,
    clearGradedResult,
    gradedResult,
    handleGrade,
    handlePublishResults,
    isGrading,
    isPublishingResults,
  } = usePredictionsGradingState({
    gradeMutation,
    publishResultsMutation,
  });

  const {
    actionFeedback,
    calculatedResult,
    clearFeedback,
    collapsedSeasons,
    deleteConfirm,
    error,
    executeDelete,
    executeRefreshCache,
    handleCalculate,
    handleCollapseAll,
    handleDelete,
    handleExpandAll,
    handlePublish,
    handleRefreshCache,
    handleRetry,
    isActionPending,
    isRefreshingCache,
    refreshCacheConfirm,
    setDeleteConfirm,
    setRefreshCacheConfirm,
    toggleSeason,
  } = useAdminPageState<CalculatePredictionsResponse>({
    calculateMutation,
    calcErrorLabel: 'Prediction generation failed',
    deleteMutation,
    getResultSeasonWeek: (r) => ({ season: r.predictions.season, week: r.predictions.week }),
    items: summaries,
    onDeleteSuccess: (season, week) => {
      if (gradedResult && gradedResult.predictions.season === season && gradedResult.predictions.week === week) {
        clearGradedResult();
      }
    },
    publishMutation,
    queryError: summariesError,
    queryErrorLabel: 'Failed to load predictions',
    refetch: refetchSummaries,
    refreshCacheMutation,
    selectedSeason,
    selectedWeek,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Predictions</h1>

      {error && <ErrorAlert error={error} onRetry={handleRetry} />}

      <CalculateSection
        buttonLabel="Generate"
        buttonPendingLabel="Generating..."
        isCalculating={calculateMutation.isPending}
        isRefreshingCache={isRefreshingCache}
        onCalculate={handleCalculate}
        onClearRefreshFeedback={clearFeedback}
        onRefreshCache={() => {
          if (selectedSeason !== null && selectedWeek !== null) {
            handleRefreshCache(selectedSeason, selectedWeek);
          }
        }}
        onSeasonChange={setSelectedSeason}
        onWeekChange={setSelectedWeek}
        refreshFeedback={actionFeedback}
        seasons={seasons}
        seasonsLoading={seasonsLoading}
        selectedSeason={selectedSeason}
        selectedWeek={selectedWeek}
        title="Generate Predictions"
        weeks={weeksData?.weeks ?? []}
        weeksLoading={weeksLoading}
      />

      <ErrorBoundary fallback={<ErrorAlert error={new Error('Failed to render predictions preview')} />}>
        {calculatedResult && (
          <PredictionsPreviewSection
            calculatedResult={calculatedResult}
            actionFeedback={actionFeedback}
            isActionPending={isActionPending}
            onClearFeedback={clearFeedback}
            onPublish={(season, week) => handlePublish(season, week, 'preview-prediction-publish')}
          />
        )}
      </ErrorBoundary>

      <GradePredictionsSection
        actionFeedback={gradingActionFeedback}
        isGrading={isGrading}
        onClearFeedback={clearGradingFeedback}
        onGrade={() => {
          if (selectedSeason !== null && selectedWeek !== null) {
            handleGrade(selectedSeason, selectedWeek);
          }
        }}
        selectedSeason={selectedSeason}
        selectedWeek={selectedWeek}
      />

      <ErrorBoundary fallback={<ErrorAlert error={new Error('Failed to render graded results preview')} />}>
        {gradedResult && (
          <GradedResultsPreviewSection
            actionFeedback={gradingActionFeedback}
            gradedResult={gradedResult}
            isActionPending={isPublishingResults}
            onClearFeedback={clearGradingFeedback}
            onPublishResults={handlePublishResults}
          />
        )}
      </ErrorBoundary>

      <ErrorBoundary fallback={<ErrorAlert error={new Error('Failed to render persisted predictions')} />}>
        <PersistedPredictionsSection
        actionFeedback={actionFeedback}
        collapsedSeasons={collapsedSeasons}
        isActionPending={isActionPending}
        onClearFeedback={clearFeedback}
        onCollapseAll={handleCollapseAll}
        onDelete={handleDelete}
        onExpandAll={handleExpandAll}
        onPublish={(season, week) => handlePublish(season, week, 'persisted-prediction-publish')}
        onToggleSeason={toggleSeason}
        summaries={summaries ?? []}
      />
      </ErrorBoundary>

      {deleteConfirm && (
        <ConfirmModal
          title="Delete Published Predictions"
          message={`These predictions (${deleteConfirm.season} ${getWeekLabel(deleteConfirm.week)}) are published and visible to users. Are you sure you want to delete them?`}
          onConfirm={() => executeDelete(deleteConfirm.season, deleteConfirm.week)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      {refreshCacheConfirm && (
        <ConfirmModal
          title="Refresh Cached Data"
          message={`This will clear cached source data for ${refreshCacheConfirm.season} ${getWeekLabel(refreshCacheConfirm.week)} and force a fresh pull from the College Football Data API on the next calculation. This is normally unnecessary since Generate already forces a fresh pull. Continue?`}
          confirmLabel="Refresh"
          onConfirm={() => executeRefreshCache(refreshCacheConfirm.season, refreshCacheConfirm.week)}
          onCancel={() => setRefreshCacheConfirm(null)}
        />
      )}
    </div>
  );
}

export default PredictionsPage;
