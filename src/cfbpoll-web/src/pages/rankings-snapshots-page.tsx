import { useMemo, useState } from 'react';

import type { CalculateResponse } from '../schemas/admin';

import {
  CalculateSection,
  PersistedRankingsSnapshotsSection,
  PreviewSection,
} from '../components/admin';
import { ErrorAlert, ErrorBoundary } from '../components/error';
import { ConfirmModal } from '../components/ui/confirm-modal';
import {
  useCalculateRankings,
  useDeleteRankingsSnapshot,
  useExportRankingsSnapshot,
  usePublishRankingsSnapshot,
  useRefreshCache,
} from '../hooks/use-admin-mutations';
import { useAdminPageState } from '../hooks/use-admin-page-state';
import { useAuth } from '../hooks/use-auth';
import { useDocumentTitle } from '../hooks/use-document-title';
import { useRankingsSnapshots } from '../hooks/use-rankings-snapshots';
import { useSeason } from '../hooks/use-season';
import { useWeekSelection } from '../hooks/use-week-selection';
import { useWeeks } from '../hooks/use-weeks';
import { toError } from '../lib/error-utils';
import { getWeekLabel } from '../lib/week-utils';

export function RankingsSnapshotsPage() {
  useDocumentTitle('Taylor Steinberg - Manage Rankings');

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
    data: rankingsSnapshots,
    error: rankingsSnapshotsError,
    isLoading: rankingsSnapshotsLoading,
    refetch: refetchRankingsSnapshots,
  } = useRankingsSnapshots(token);

  const calculateMutation = useCalculateRankings(token);
  const publishMutation = usePublishRankingsSnapshot(token);
  const deleteMutation = useDeleteRankingsSnapshot(token);
  const exportMutation = useExportRankingsSnapshot(token);
  const refreshCacheMutation = useRefreshCache(token);

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
    setOperationError,
    setRefreshCacheConfirm,
    toggleSeason,
  } = useAdminPageState<CalculateResponse>({
    calculateMutation,
    calcErrorLabel: 'Calculation failed',
    deleteMutation,
    getResultSeasonWeek: (r) => ({ season: r.rankings.season, week: r.rankings.week }),
    items: rankingsSnapshots,
    publishMutation,
    queryError: rankingsSnapshotsError,
    queryErrorLabel: 'Failed to load rankings snapshots',
    refetch: refetchRankingsSnapshots,
    refreshCacheMutation,
    selectedSeason,
    selectedWeek,
  });

  const handleExport = async (season: number, week: number) => {
    setOperationError(null);
    try {
      await exportMutation.mutateAsync({ season, week });
    } catch (err) {
      setOperationError(toError(err, 'Export failed'));
    }
  };

  const existingRankingsSnapshotForSelection = useMemo(
    () => rankingsSnapshots?.find((s) => s.season === selectedSeason && s.week === selectedWeek) ?? null,
    [rankingsSnapshots, selectedSeason, selectedWeek]
  );

  const [calculateConfirm, setCalculateConfirm] = useState<{ season: number; week: number } | null>(null);

  const handleCalculateClick = () => {
    if (existingRankingsSnapshotForSelection?.isPublished && selectedSeason !== null && selectedWeek !== null) {
      setCalculateConfirm({ season: selectedSeason, week: selectedWeek });
      return;
    }
    handleCalculate();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Rankings</h1>

      {error && <ErrorAlert error={error} onRetry={handleRetry} />}

      <CalculateSection
        isCalculating={calculateMutation.isPending}
        isRefreshingCache={isRefreshingCache}
        onCalculate={handleCalculateClick}
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
        weeks={weeksData?.weeks ?? []}
        weeksLoading={weeksLoading}
      />

      <ErrorBoundary fallback={<ErrorAlert error={new Error('Failed to render rankings preview')} />}>
        {calculatedResult && (
          <PreviewSection
            calculatedResult={calculatedResult}
            actionFeedback={actionFeedback}
            isActionPending={isActionPending}
            onClearFeedback={clearFeedback}
            onExport={handleExport}
            onPublish={(season, week) => handlePublish(season, week, 'preview-publish')}
          />
        )}
      </ErrorBoundary>

      <ErrorBoundary fallback={<ErrorAlert error={new Error('Failed to render persisted rankings snapshots')} />}>
        <PersistedRankingsSnapshotsSection
          actionFeedback={actionFeedback}
          collapsedSeasons={collapsedSeasons}
          isActionPending={isActionPending}
          isLoading={rankingsSnapshotsLoading}
          onClearFeedback={clearFeedback}
          onCollapseAll={handleCollapseAll}
          onDelete={handleDelete}
          onExpandAll={handleExpandAll}
          onExport={handleExport}
          onPublish={(season, week) => handlePublish(season, week, 'rankings-snapshot-publish')}
          onToggleSeason={toggleSeason}
          rankingsSnapshots={rankingsSnapshots ?? []}
        />
      </ErrorBoundary>

      {deleteConfirm && (
        <ConfirmModal
          title="Delete Published Rankings"
          message={`These rankings (${deleteConfirm.season} ${getWeekLabel(deleteConfirm.week)}) are published and visible to users. Are you sure you want to delete them?`}
          onConfirm={() => executeDelete(deleteConfirm.season, deleteConfirm.week)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      {calculateConfirm && (
        <ConfirmModal
          title="Overwrite Published Rankings"
          message={`The rankings for ${calculateConfirm.season} ${getWeekLabel(calculateConfirm.week)} are already published and visible to users. Recalculating will overwrite them and reset them to draft. Continue?`}
          confirmLabel="Calculate"
          onConfirm={() => {
            setCalculateConfirm(null);
            handleCalculate();
          }}
          onCancel={() => setCalculateConfirm(null)}
        />
      )}

      {refreshCacheConfirm && (
        <ConfirmModal
          title="Refresh Cached Data"
          message={`This will clear cached source data for ${refreshCacheConfirm.season} ${getWeekLabel(refreshCacheConfirm.week)} and force a fresh pull from the College Football Data API on the next calculation. This is normally unnecessary since Calculate already forces a fresh pull. Continue?`}
          confirmLabel="Refresh"
          onConfirm={() => executeRefreshCache(refreshCacheConfirm.season, refreshCacheConfirm.week)}
          onCancel={() => setRefreshCacheConfirm(null)}
        />
      )}
    </div>
  );
}

export default RankingsSnapshotsPage;
