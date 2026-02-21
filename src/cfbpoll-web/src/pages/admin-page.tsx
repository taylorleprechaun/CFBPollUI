import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/auth-context';
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
import { useDocumentTitle } from '../hooks/use-document-title';
import { usePersistedWeeks } from '../hooks/use-persisted-weeks';
import { useWeekSelection } from '../hooks/use-week-selection';
import { useWeeks } from '../hooks/use-weeks';
import { getWeekLabel } from '../lib/week-utils';
import type { CalculateResponse } from '../schemas/admin';

export function AdminPage() {
  useDocumentTitle('Admin - CFB Poll');

  const { token, logout } = useAuth();

  const {
    seasons,
    seasonsLoading,
    selectedSeason,
    setSelectedSeason,
  } = useSeason();

  const { data: weeksData, isLoading: weeksLoading } = useWeeks(selectedSeason);
  const { selectedWeek, setSelectedWeek } = useWeekSelection(weeksData?.weeks);

  const {
    data: persistedWeeks,
    error: persistedWeeksError,
  } = usePersistedWeeks(token);

  const calculateMutation = useCalculateRankings(token);
  const publishMutation = usePublishSnapshot(token);
  const deleteMutation = useDeleteSnapshot(token);
  const exportMutation = useExportSnapshot(token);

  const [calculatedResult, setCalculatedResult] = useState<CalculateResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [actionFeedback, setActionFeedback] = useState<ActionFeedback | null>(null);
  const [collapsedSeasons, setCollapsedSeasons] = useState<Set<number>>(new Set());
  const [initialCollapseApplied, setInitialCollapseApplied] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ season: number; week: number } | null>(null);

  useEffect(() => {
    if (persistedWeeks?.length && !initialCollapseApplied) {
      setCollapsedSeasons(new Set(persistedWeeks.map((w) => w.season)));
      setInitialCollapseApplied(true);
    }
  }, [persistedWeeks, initialCollapseApplied]);

  useEffect(() => {
    if (persistedWeeksError) {
      setError(persistedWeeksError instanceof Error ? persistedWeeksError : new Error('Failed to load persisted weeks'));
    }
  }, [persistedWeeksError]);

  const isActionPending = calculateMutation.isPending || publishMutation.isPending || deleteMutation.isPending || exportMutation.isPending;

  const clearFeedback = useCallback(() => setActionFeedback(null), []);

  const handleCalculate = async () => {
    if (selectedSeason === null || selectedWeek === null) return;
    setError(null);
    setCalculatedResult(null);

    try {
      const result = await calculateMutation.mutateAsync({ season: selectedSeason, week: selectedWeek });
      setCalculatedResult(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Calculation failed'));
    }
  };

  const handlePublish = async (season: number, week: number, source: 'preview' | 'snapshot') => {
    setError(null);
    setActionFeedback(null);
    const feedbackKey = `${source}-publish-${season}-${week}`;

    try {
      await publishMutation.mutateAsync({ season, week });
      setActionFeedback({ key: feedbackKey, type: 'success' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Publish failed';
      setActionFeedback({ key: feedbackKey, type: 'error', message });
    }
  };

  const handleDelete = async (season: number, week: number, published: boolean) => {
    if (published) {
      setDeleteConfirm({ season, week });
      return;
    }
    await executeDelete(season, week);
  };

  const executeDelete = async (season: number, week: number) => {
    setError(null);
    setDeleteConfirm(null);

    try {
      await deleteMutation.mutateAsync({ season, week });
      if (calculatedResult?.rankings.season === season && calculatedResult?.rankings.week === week) {
        setCalculatedResult(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Delete failed'));
    }
  };

  const handleExport = async (season: number, week: number) => {
    setError(null);

    try {
      await exportMutation.mutateAsync({ season, week });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Export failed'));
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
  const handleCollapseAll = () => {
    if (persistedWeeks) {
      setCollapsedSeasons(new Set(persistedWeeks.map((w) => w.season)));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <button
          onClick={logout}
          className="text-sm text-gray-600 hover:text-gray-900 underline"
        >
          Log Out
        </button>
      </div>

      {error && <ErrorAlert error={error} onRetry={() => setError(null)} />}

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
        persistedWeeks={persistedWeeks ?? []}
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
