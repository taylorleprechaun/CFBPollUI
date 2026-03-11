import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { UseMutationResult } from '@tanstack/react-query';

import type { ActionFeedback } from '../components/admin';
import { toError, toErrorMessage } from '../lib/error-utils';

interface SeasonWeekParams {
  season: number;
  week: number;
}

interface UseAdminPageStateOptions<TCalcResult> {
  calculateMutation: UseMutationResult<TCalcResult, Error, SeasonWeekParams>;
  calcErrorLabel: string;
  deleteMutation: UseMutationResult<void, Error, SeasonWeekParams>;
  getResultSeasonWeek: (result: TCalcResult) => SeasonWeekParams;
  items: { season: number }[] | undefined;
  publishMutation: UseMutationResult<void, Error, SeasonWeekParams>;
  queryError: Error | null;
  queryErrorLabel: string;
  refetch: () => void;
  selectedSeason: number | null;
  selectedWeek: number | null;
}

export function useAdminPageState<TCalcResult>({
  calculateMutation,
  calcErrorLabel,
  deleteMutation,
  getResultSeasonWeek,
  items,
  publishMutation,
  queryError,
  queryErrorLabel,
  refetch,
  selectedSeason,
  selectedWeek,
}: UseAdminPageStateOptions<TCalcResult>) {
  const [calculatedResult, setCalculatedResult] = useState<TCalcResult | null>(null);
  const [operationError, setOperationError] = useState<Error | null>(null);
  const [actionFeedback, setActionFeedback] = useState<ActionFeedback | null>(null);
  const [collapsedSeasons, setCollapsedSeasons] = useState<Set<number>>(new Set());
  const initialCollapseApplied = useRef(false);
  const [deleteConfirm, setDeleteConfirm] = useState<SeasonWeekParams | null>(null);

  const normalizedQueryError = queryError
    ? toError(queryError, queryErrorLabel)
    : null;
  const error = operationError ?? normalizedQueryError;

  const isActionPending = calculateMutation.isPending || publishMutation.isPending || deleteMutation.isPending;

  const clearFeedback = useCallback(() => setActionFeedback(null), []);

  const uniqueSeasons = useMemo(
    () => items ? [...new Set(items.map((item) => item.season))] : [],
    [items],
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
      setOperationError(toError(err, calcErrorLabel));
    }
  };

  const handlePublish = async (season: number, week: number, feedbackKeyPrefix: string) => {
    setOperationError(null);
    setActionFeedback(null);

    try {
      await publishMutation.mutateAsync({ season, week });
      setActionFeedback({ key: `${feedbackKeyPrefix}-${season}-${week}`, type: 'success' });
    } catch (err) {
      setActionFeedback({ key: `${feedbackKeyPrefix}-${season}-${week}`, type: 'error', message: toErrorMessage(err, 'Publish failed') });
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
      if (calculatedResult) {
        const resultSW = getResultSeasonWeek(calculatedResult);
        if (resultSW.season === season && resultSW.week === week) {
          setCalculatedResult(null);
        }
      }
    } catch (err) {
      setOperationError(toError(err, 'Delete failed'));
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
    if (normalizedQueryError) refetch();
  }, [normalizedQueryError, refetch]);

  return {
    actionFeedback,
    calculatedResult,
    clearFeedback,
    collapsedSeasons,
    deleteConfirm,
    error,
    executeDelete,
    handleCalculate,
    handleCollapseAll,
    handleDelete,
    handleExpandAll,
    handlePublish,
    handleRetry,
    isActionPending,
    setDeleteConfirm,
    setOperationError,
    toggleSeason,
  };
}
