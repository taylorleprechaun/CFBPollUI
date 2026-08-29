import { type QueryClient, useMutation, useQueryClient } from '@tanstack/react-query';

import type { AdminPredictionsResponse } from '../schemas/admin';
import type { SeasonWeekParams } from './types';

import {
  calculatePredictions,
  calculateRankings,
  deletePredictions,
  deleteRankingsSnapshot,
  downloadExport,
  downloadPredictionsExport,
  fetchRanking,
  gradePredictions,
  publishGradedResults,
  publishPredictions,
  publishRankingsSnapshot,
  refreshCache,
} from '../services/admin-api';

export function useCalculatePredictions(token: string | null) {
  return useAdminMutation(token, calculatePredictions, (_result, _params, queryClient) => {
    queryClient.invalidateQueries({ queryKey: ['predictions-summaries'] });
  });
}

export function useCalculateRankings(token: string | null) {
  return useAdminMutation(token, calculateRankings, (_result, _params, queryClient) => {
    queryClient.invalidateQueries({ queryKey: ['rankings-snapshots'] });
  });
}

export function useDeletePredictions(token: string | null) {
  return useAdminMutation(token, deletePredictions, (_result, { season, week }, queryClient) => {
    queryClient.invalidateQueries({ queryKey: ['predictions-summaries'] });
    queryClient.removeQueries({ queryKey: ['admin-prediction', season, week], exact: true });
  });
}

export function useDeleteRankingsSnapshot(token: string | null) {
  return useAdminMutation(token, deleteRankingsSnapshot, (_result, _params, queryClient) => {
    queryClient.invalidateQueries({ queryKey: ['rankings-snapshots'] });
  });
}

export function useExportPredictions(token: string | null) {
  return useAdminMutation(token, downloadPredictionsExport);
}

export function useExportRankingsSnapshot(token: string | null) {
  return useAdminMutation(token, downloadExport);
}

export function useGradePredictions(token: string | null) {
  return useAdminMutation(token, gradePredictions, (_result, _params, queryClient) => {
    queryClient.invalidateQueries({ queryKey: ['predictions-summaries'] });
  });
}

export function usePublishGradedResults(token: string | null) {
  return useAdminMutation(token, publishGradedResults, (_result, { season, week }, queryClient) => {
    queryClient.invalidateQueries({ queryKey: ['predictions-summaries'] });
    queryClient.setQueryData(
      ['admin-prediction', season, week],
      (old: AdminPredictionsResponse | undefined) =>
        old && { ...old, predictions: { ...old.predictions, resultsPublished: true } },
    );
  });
}

export function usePublishPredictions(token: string | null) {
  return useAdminMutation(token, publishPredictions, (_result, { season, week }, queryClient) => {
    queryClient.invalidateQueries({ queryKey: ['predictions-summaries'] });
    queryClient.setQueryData(
      ['admin-prediction', season, week],
      (old: AdminPredictionsResponse | undefined) => old && { ...old, isPublished: true },
    );
  });
}

export function usePublishRankingsSnapshot(token: string | null) {
  return useAdminMutation(token, publishRankingsSnapshot, (_result, _params, queryClient) => {
    queryClient.invalidateQueries({ queryKey: ['rankings-snapshots'] });
  });
}

export function useRefreshCache(token: string | null) {
  return useAdminMutation(token, refreshCache);
}

export function useViewRankingsSnapshot(token: string | null) {
  return useAdminMutation(token, fetchRanking);
}

function useAdminMutation<TResult>(
  token: string | null,
  apiFn: (token: string, season: number, week: number) => Promise<TResult>,
  onSuccess?: (result: TResult, params: SeasonWeekParams, queryClient: QueryClient) => void,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ season, week }: SeasonWeekParams) => {
      if (!token) throw new Error('Authentication required');
      return apiFn(token, season, week);
    },
    onSuccess: (result, params) => onSuccess?.(result, params, queryClient),
  });
}
