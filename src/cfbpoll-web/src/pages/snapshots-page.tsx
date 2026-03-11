import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useSeason } from '../contexts/season-context';
import {
  CalculateSection,
  PersistedSnapshotsSection,
  PreviewSection,
  type ActionFeedback,
} from '../components/admin';
import { ErrorAlert } from '../components/error';
import { ConfirmModal } from '../components/ui/confirm-modal';
import {
  useCalculateRankings,
  useDeleteSnapshot,
  useExportSnapshot,
  usePublishSnapshot,
} from '../hooks/use-admin-mutations';
import { useAuth } from '../contexts/auth-context';
import { useDocumentTitle } from '../hooks/use-document-title';
import { useSnapshots } from '../hooks/use-snapshots';
import { useWeekSelection } from '../hooks/use-week-selection';
import { useWeeks } from '../hooks/use-weeks';
import { toError, toErrorMessage } from '../lib/error-utils';
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

  const [calculatedResult, setCalculatedResult] = useState<CalculateResponse | null>(null);
  const [operationError, setOperationError] = useState<Error | null>(null);
  const [actionFeedback, setActionFeedback] = useState<ActionFeedback | null>(null);
  const [collapsedSeasons, setCollapsedSeasons] = useState<Set<number>>(new Set());
  const initialCollapseApplied = useRef(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ season: number; week: number } | null>(null);

  const normalizedSnapshotsError = snapshotsError
    ? toError(snapshotsError, 'Failed to load snapshots')
    : null;
  const error = operationError ?? normalizedSnapshotsError;

  const isActionPending = calculateMutation.isPending || publishMutation.isPending || deleteMutation.isPending;

  const clearFeedback = useCallback(() => setActionFeedback(null), []);

  const uniqueSeasons = useMemo(
    () => snapshots ? [...new Set(snapshots.map((w) => w.season))] : [],
    [snapshots],
  );

  useEffect(() => {
    if (uniqueSeasons.length > 0 && !initialCollapseApplied.current) {
      setCollapsedSeasons(new Set(uniqueSeasons));
      initialCollapseApplied.current = true;
    }
  }, [uniqueSeasons]);

  const handleCalculate = async () => {
    if (selectedSeason === null || selectedWeek === null) return;
    setOperationError(null);
    setCalculatedResult(null);

    try {
      const result = await calculateMutation.mutateAsync({ season: selectedSeason, week: selectedWeek });
      setCalculatedResult(result);
    } catch (err) {
      setOperationError(toError(err, 'Calculation failed'));
    }
  };

  const handlePublish = async (season: number, week: number, source: 'preview' | 'snapshot') => {
    setOperationError(null);
    setActionFeedback(null);
    const feedbackKey = `${source}-publish-${season}-${week}`;

    try {
      await publishMutation.mutateAsync({ season, week });
      setActionFeedback({ key: feedbackKey, type: 'success' });
    } catch (err) {
      setActionFeedback({ key: feedbackKey, type: 'error', message: toErrorMessage(err, 'Publish failed') });
    }
  };

  const handleDelete = async (season: number, week: number, isPublished: boolean) => {
    if (isPublished) {
      setDeleteConfirm({ season, week });
      return;
    }
    await executeDelete(season, week);
  };

  const executeDelete = async (season: number, week: number) => {
    setOperationError(null);
    setDeleteConfirm(null);

    try {
      await deleteMutation.mutateAsync({ season, week });
      if (calculatedResult?.rankings.season === season && calculatedResult?.rankings.week === week) {
        setCalculatedResult(null);
      }
    } catch (err) {
      setOperationError(toError(err, 'Delete failed'));
    }
  };

  const handleExport = async (season: number, week: number) => {
    setOperationError(null);

    try {
      await exportMutation.mutateAsync({ season, week });
    } catch (err) {
      setOperationError(toError(err, 'Export failed'));
    }
  };

  const toggleSeason = (season: number) => {
    setCollapsedSeasons((prev) => {
      const next = new Set(prev);
      if (next.has(season)) {
        next.delete(season);
      } else {
        next.add(season);
      }
      return next;
    });
  };

  const handleExpandAll = () => setCollapsedSeasons(new Set());
  const handleCollapseAll = () => setCollapsedSeasons(new Set(uniqueSeasons));

  const handleRetry = useCallback(() => {
    setOperationError(null);
    if (normalizedSnapshotsError) refetchSnapshots();
  }, [normalizedSnapshotsError, refetchSnapshots]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Snapshots</h1>

      {error && <ErrorAlert error={error} onRetry={handleRetry} />}

      <CalculateSection
        isCalculating={calculateMutation.isPending}
        onCalculate={handleCalculate}
        onSeasonChange={setSelectedSeason}
        onWeekChange={setSelectedWeek}
        seasons={seasons}
        seasonsLoading={seasonsLoading}
        selectedSeason={selectedSeason}
        selectedWeek={selectedWeek}
        weeks={weeksData?.weeks ?? []}
        weeksLoading={weeksLoading}
      />

      {calculatedResult && (
        <PreviewSection
          calculatedResult={calculatedResult}
          actionFeedback={actionFeedback}
          isActionPending={isActionPending}
          onClearFeedback={clearFeedback}
          onExport={handleExport}
          onPublish={handlePublish}
        />
      )}

      <PersistedSnapshotsSection
        actionFeedback={actionFeedback}
        collapsedSeasons={collapsedSeasons}
        isActionPending={isActionPending}
        onClearFeedback={clearFeedback}
        onCollapseAll={handleCollapseAll}
        onDelete={handleDelete}
        onExpandAll={handleExpandAll}
        onExport={handleExport}
        onPublish={handlePublish}
        onToggleSeason={toggleSeason}
        snapshots={snapshots ?? []}
      />

      {deleteConfirm && (
        <ConfirmModal
          title="Delete Published Snapshot"
          message={`This snapshot (${deleteConfirm.season} ${getWeekLabel(deleteConfirm.week)}) is published and visible to users. Are you sure you want to delete it?`}
          onConfirm={() => executeDelete(deleteConfirm.season, deleteConfirm.week)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}

export default SnapshotsPage;
