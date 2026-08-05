import { useEffect, useMemo, useState } from 'react';

import { useSeason } from '../hooks/use-season';
import {
  ActivePredictionViewSection,
  CalculateSection,
  PersistedPredictionsSection,
} from '../components/admin';
import { ErrorAlert, ErrorBoundary } from '../components/error';
import { ConfirmModal } from '../components/ui/confirm-modal';
import { BUTTON_GHOST } from '../components/ui/button-styles';
import {
  useCalculatePredictions,
  useDeletePredictions,
  useGradePredictions,
  usePublishGradedResults,
  usePublishPredictions,
  useRefreshCache,
} from '../hooks/use-admin-mutations';
import { useAdminPageState } from '../hooks/use-admin-page-state';
import { useAuth } from '../hooks/use-auth';
import { useDocumentTitle } from '../hooks/use-document-title';
import { usePredictionsActiveView } from '../hooks/use-predictions-active-view';
import { usePredictionsGradingState } from '../hooks/use-predictions-grading-state';
import { usePredictionsSummaries } from '../hooks/use-predictions-summaries';
import { useWeekSelection } from '../hooks/use-week-selection';
import { useWeeks } from '../hooks/use-weeks';
import { derivePredictionStage, predictionStageLabel } from '../lib/prediction-stage';
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
    isLoading: summariesLoading,
    refetch: refetchSummaries,
  } = usePredictionsSummaries(token);

  const existingSummaryForSelection = useMemo(
    () => summaries?.find((s) => s.season === selectedSeason && s.week === selectedWeek) ?? null,
    [summaries, selectedSeason, selectedWeek]
  );

  const calculateMutation = useCalculatePredictions(token);
  const publishMutation = usePublishPredictions(token);
  const deleteMutation = useDeletePredictions(token);
  const refreshCacheMutation = useRefreshCache(token);
  const gradeMutation = useGradePredictions(token);
  const publishResultsMutation = usePublishGradedResults(token);

  const activeView = usePredictionsActiveView(token);

  // Suppress the "already exists" banner when the selectors just match whatever the active view
  // is already displaying (e.g. right after clicking View) - showing it then would be redundant,
  // since the matching week is already on screen, not merely available to look up.
  const selectionMatchesActiveView = activeView.season === selectedSeason && activeView.week === selectedWeek;

  // Keep the Generate season+week selectors pointed at whatever the active view is currently
  // showing (on load from the URL, after Generate/Grade, or after clicking View) so Regenerate
  // targets the displayed week rather than a stale, unrelated dropdown selection. Deliberately
  // depends only on activeView.season/week (not selectedSeason/selectedWeek) - the sync is
  // one-directional, so it must not re-fire just because the user manually changes the dropdown
  // afterward.
  useEffect(() => {
    if (activeView.season === null || activeView.week === null) return;
    setSelectedSeason(activeView.season);
    setSelectedWeek(activeView.week);
  }, [activeView.season, activeView.week, setSelectedSeason, setSelectedWeek]);

  const {
    actionFeedback: gradingActionFeedback,
    clearFeedback: clearGradingFeedback,
    handleGrade,
    handlePublishResults,
    isGrading,
    isPublishingResults,
  } = usePredictionsGradingState({
    gradeMutation,
    onGradeSuccess: activeView.applyGraded,
    publishResultsMutation,
  });

  const {
    actionFeedback,
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
    onCalculateSuccess: activeView.applyCalculated,
    onDeleteSuccess: (season, week) => activeView.clearIfMatches(season, week),
    publishMutation,
    queryError: summariesError,
    queryErrorLabel: 'Failed to load predictions',
    refetch: refetchSummaries,
    refreshCacheMutation,
    selectedSeason,
    selectedWeek,
  });

  const [generateConfirm, setGenerateConfirm] = useState<{ season: number; stage: string; week: number } | null>(null);

  const handleGenerateClick = () => {
    if (existingSummaryForSelection && selectedSeason !== null && selectedWeek !== null) {
      const stage = derivePredictionStage(existingSummaryForSelection);
      if (stage !== 'draft') {
        setGenerateConfirm({ season: selectedSeason, stage: predictionStageLabel(stage), week: selectedWeek });
        return;
      }
    }
    handleCalculate();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Predictions</h1>

      {error && <ErrorAlert error={error} onRetry={handleRetry} />}

      <CalculateSection
        buttonLabel="Generate"
        buttonPendingLabel="Generating..."
        isCalculating={calculateMutation.isPending}
        isRefreshingCache={isRefreshingCache}
        onCalculate={handleGenerateClick}
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

      {existingSummaryForSelection && selectedSeason !== null && selectedWeek !== null && !selectionMatchesActiveView && (
        <div className="bg-surface border border-border rounded-xl p-4 flex items-center justify-between gap-4 animate-fade-in">
          <p className="text-sm text-text-secondary">
            {selectedSeason} {getWeekLabel(selectedWeek)} already has{' '}
            {predictionStageLabel(derivePredictionStage(existingSummaryForSelection)).toLowerCase()} predictions.
          </p>
          <button
            onClick={() => activeView.showView(selectedSeason, selectedWeek)}
            className={BUTTON_GHOST}
          >
            View
          </button>
        </div>
      )}

      <ErrorBoundary fallback={<ErrorAlert error={new Error('Failed to render predictions view')} />}>
        {activeView.view && (
          <ActivePredictionViewSection
            gradeFeedback={gradingActionFeedback}
            isActionPending={isActionPending || isPublishingResults || isGrading}
            isGrading={isGrading}
            onClearGradeFeedback={clearGradingFeedback}
            onClearPublishFeedback={clearFeedback}
            onClearPublishResultsFeedback={clearGradingFeedback}
            onGrade={handleGrade}
            onPublish={(season, week) => handlePublish(season, week, 'active-view-publish')}
            onPublishResults={handlePublishResults}
            publishFeedback={actionFeedback}
            publishResultsFeedback={gradingActionFeedback}
            view={activeView.view}
          />
        )}
      </ErrorBoundary>

      <ErrorBoundary fallback={<ErrorAlert error={new Error('Failed to render persisted predictions')} />}>
        <PersistedPredictionsSection
        actionFeedback={actionFeedback}
        activeItem={activeView.view ? { season: activeView.view.season, week: activeView.view.week } : null}
        collapsedSeasons={collapsedSeasons}
        isActionPending={isActionPending}
        isLoading={summariesLoading}
        onClearFeedback={clearFeedback}
        onCollapseAll={handleCollapseAll}
        onDelete={handleDelete}
        onExpandAll={handleExpandAll}
        onPublish={(season, week) => handlePublish(season, week, 'persisted-prediction-publish')}
        onToggleSeason={toggleSeason}
        onView={activeView.showView}
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

      {generateConfirm && (
        <ConfirmModal
          title="Overwrite Existing Predictions"
          message={`Predictions for ${generateConfirm.season} ${getWeekLabel(generateConfirm.week)} already exist with a status of ${generateConfirm.stage}. Generating new predictions will overwrite them and reset their published/graded status. Continue?`}
          confirmLabel="Generate"
          onConfirm={() => {
            setGenerateConfirm(null);
            handleCalculate();
          }}
          onCancel={() => setGenerateConfirm(null)}
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
