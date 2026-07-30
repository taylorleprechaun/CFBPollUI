import { useSeason } from '../contexts/season-context';
import {
  CalculateSection,
  PersistedSnapshotsSection,
  PreviewSection,
} from '../components/admin';
import { ErrorAlert, ErrorBoundary } from '../components/error';
import { ConfirmModal } from '../components/ui/confirm-modal';
import {
  useCalculateRankings,
  useDeleteSnapshot,
  useExportSnapshot,
  usePublishSnapshot,
  useRefreshCache,
} from '../hooks/use-admin-mutations';
import { useAdminPageState } from '../hooks/use-admin-page-state';
import { useAuth } from '../contexts/auth-context';
import { useDocumentTitle } from '../hooks/use-document-title';
import { useSnapshots } from '../hooks/use-snapshots';
import { useWeekSelection } from '../hooks/use-week-selection';
import { useWeeks } from '../hooks/use-weeks';
import { toError } from '../lib/error-utils';
import { getWeekLabel } from '../lib/week-utils';
import type { CalculateResponse } from '../schemas/admin';

export function SnapshotsPage() {
  useDocumentTitle('Snapshots - CFB Poll');

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
    data: snapshots,
    error: snapshotsError,
    refetch: refetchSnapshots,
  } = useSnapshots(token);

  const calculateMutation = useCalculateRankings(token);
  const publishMutation = usePublishSnapshot(token);
  const deleteMutation = useDeleteSnapshot(token);
  const exportMutation = useExportSnapshot(token);
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
    items: snapshots,
    publishMutation,
    queryError: snapshotsError,
    queryErrorLabel: 'Failed to load snapshots',
    refetch: refetchSnapshots,
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Snapshots</h1>

      {error && <ErrorAlert error={error} onRetry={handleRetry} />}

      <CalculateSection
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

      <ErrorBoundary fallback={<ErrorAlert error={new Error('Failed to render persisted snapshots')} />}>
        <PersistedSnapshotsSection
        actionFeedback={actionFeedback}
        collapsedSeasons={collapsedSeasons}
        isActionPending={isActionPending}
        onClearFeedback={clearFeedback}
        onCollapseAll={handleCollapseAll}
        onDelete={handleDelete}
        onExpandAll={handleExpandAll}
        onExport={handleExport}
        onPublish={(season, week) => handlePublish(season, week, 'snapshot-publish')}
        onToggleSeason={toggleSeason}
        snapshots={snapshots ?? []}
      />
      </ErrorBoundary>

      {deleteConfirm && (
        <ConfirmModal
          title="Delete Published Snapshot"
          message={`This snapshot (${deleteConfirm.season} ${getWeekLabel(deleteConfirm.week)}) is published and visible to users. Are you sure you want to delete it?`}
          onConfirm={() => executeDelete(deleteConfirm.season, deleteConfirm.week)}
          onCancel={() => setDeleteConfirm(null)}
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

export default SnapshotsPage;
