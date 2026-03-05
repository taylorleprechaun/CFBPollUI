import { useCallback, useEffect, useId, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '../contexts/auth-context';
import { useSeason } from '../contexts/season-context';
import { usePageVisibility } from '../hooks/use-page-visibility';
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
import { useSnapshots } from '../hooks/use-snapshots';
import { useWeekSelection } from '../hooks/use-week-selection';
import { useWeeks } from '../hooks/use-weeks';
import { getWeekLabel } from '../lib/week-utils';
import type { CalculateResponse } from '../schemas/admin';
import { updatePageVisibility } from '../services/admin-api';

export function AdminPage() {
  useDocumentTitle('Admin - CFB Poll');

  const { token, logout } = useAuth();
  const { allTimeEnabled, pollLeadersEnabled } = usePageVisibility();
  const queryClient = useQueryClient();
  const allTimeToggleId = useId();
  const pollLeadersToggleId = useId();

  const [visibilityFeedback, setVisibilityFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const visibilityMutation = useMutation({
    mutationFn: (visibility: { allTimeEnabled: boolean; pollLeadersEnabled: boolean }) => {
      if (!token) throw new Error('Authentication required');
      return updatePageVisibility(token, visibility);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page-visibility'] });
    },
  });

  const handleToggle = async (field: 'allTimeEnabled' | 'pollLeadersEnabled', value: boolean) => {
    setVisibilityFeedback(null);
    const updated = {
      allTimeEnabled,
      pollLeadersEnabled,
      [field]: value,
    };
    try {
      await visibilityMutation.mutateAsync(updated);
      setVisibilityFeedback({ type: 'success', message: 'Page visibility updated' });
    } catch {
      setVisibilityFeedback({ type: 'error', message: 'Failed to update page visibility' });
    }
  };

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
  const [initialCollapseApplied, setInitialCollapseApplied] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ season: number; week: number } | null>(null);

  const normalizedSnapshotsError = snapshotsError instanceof Error
    ? snapshotsError
    : snapshotsError ? new Error('Failed to load snapshots') : null;
  const error = operationError ?? normalizedSnapshotsError;

  const isActionPending = calculateMutation.isPending || publishMutation.isPending || deleteMutation.isPending || exportMutation.isPending;

  const clearFeedback = useCallback(() => setActionFeedback(null), []);

  useEffect(() => {
    if (snapshots?.length && !initialCollapseApplied) {
      setCollapsedSeasons(new Set(snapshots.map((w) => w.season)));
      setInitialCollapseApplied(true);
    }
  }, [snapshots, initialCollapseApplied]);

  const handleCalculate = async () => {
    if (selectedSeason === null || selectedWeek === null) return;
    setOperationError(null);
    setCalculatedResult(null);

    try {
      const result = await calculateMutation.mutateAsync({ season: selectedSeason, week: selectedWeek });
      setCalculatedResult(result);
    } catch (err) {
      setOperationError(err instanceof Error ? err : new Error('Calculation failed'));
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
      const message = err instanceof Error ? err.message : 'Publish failed';
      setActionFeedback({ key: feedbackKey, type: 'error', message });
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
      setOperationError(err instanceof Error ? err : new Error('Delete failed'));
    }
  };

  const handleExport = async (season: number, week: number) => {
    setOperationError(null);

    try {
      await exportMutation.mutateAsync({ season, week });
    } catch (err) {
      setOperationError(err instanceof Error ? err : new Error('Export failed'));
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
    if (snapshots) {
      setCollapsedSeasons(new Set(snapshots.map((w) => w.season)));
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

      {error && <ErrorAlert error={error} onRetry={() => {
        setOperationError(null);
        if (normalizedSnapshotsError) refetchSnapshots();
      }} />}

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Page Visibility</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor={allTimeToggleId} className="text-sm font-medium text-gray-700">
              All-Time Rankings
            </label>
            <input
              id={allTimeToggleId}
              type="checkbox"
              role="switch"
              checked={allTimeEnabled}
              onChange={(e) => handleToggle('allTimeEnabled', e.target.checked)}
              disabled={visibilityMutation.isPending}
              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <label htmlFor={pollLeadersToggleId} className="text-sm font-medium text-gray-700">
              Poll Leaders
            </label>
            <input
              id={pollLeadersToggleId}
              type="checkbox"
              role="switch"
              checked={pollLeadersEnabled}
              onChange={(e) => handleToggle('pollLeadersEnabled', e.target.checked)}
              disabled={visibilityMutation.isPending}
              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
        </div>
        {visibilityFeedback && (
          <p className={`mt-3 text-sm ${visibilityFeedback.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
            {visibilityFeedback.message}
          </p>
        )}
      </div>

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
