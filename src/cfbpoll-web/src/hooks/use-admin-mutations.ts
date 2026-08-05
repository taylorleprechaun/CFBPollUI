import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import {
  calculatePredictions,
  calculateRankings,
  deletePredictions,
  deleteSnapshot,
  downloadExport,
  gradePredictions,
  publishGradedResults,
  publishPredictions,
  publishSnapshot,
  refreshCache,
} from '../services/admin-api';
import type { AdminPredictionsResponse } from '../schemas/admin';
import type { SeasonWeekParams } from './types';

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

export function useCalculateRankings(token: string | null) {
  return useAdminMutation(token, calculateRankings, (_result, _params, queryClient) => {
    queryClient.invalidateQueries({ queryKey: ['snapshots'] });
  });
}

export function usePublishSnapshot(token: string | null) {
  return useAdminMutation(token, publishSnapshot, (_result, _params, queryClient) => {
    queryClient.invalidateQueries({ queryKey: ['snapshots'] });
  });
}

export function useDeleteSnapshot(token: string | null) {
  return useAdminMutation(token, deleteSnapshot, (_result, _params, queryClient) => {
    queryClient.invalidateQueries({ queryKey: ['snapshots'] });
  });
}

export function useCalculatePredictions(token: string | null) {
  return useAdminMutation(token, calculatePredictions, (_result, _params, queryClient) => {
    queryClient.invalidateQueries({ queryKey: ['predictions-summaries'] });
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

export function useDeletePredictions(token: string | null) {
  return useAdminMutation(token, deletePredictions, (_result, { season, week }, queryClient) => {
    queryClient.invalidateQueries({ queryKey: ['predictions-summaries'] });
    queryClient.removeQueries({ queryKey: ['admin-prediction', season, week], exact: true });
  });
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

export function useRefreshCache(token: string | null) {
  return useAdminMutation(token, refreshCache);
}

export function useExportSnapshot(token: string | null) {
  return useAdminMutation(token, downloadExport);
}
