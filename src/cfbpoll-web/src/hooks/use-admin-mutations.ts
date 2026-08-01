import { useMutation, useQueryClient } from '@tanstack/react-query';
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

export function useCalculateRankings(token: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ season, week }: { season: number; week: number }) => {
      if (!token) throw new Error('Authentication required');
      return calculateRankings(token, season, week);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['snapshots'] });
    },
  });
}

export function usePublishSnapshot(token: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ season, week }: { season: number; week: number }) => {
      if (!token) throw new Error('Authentication required');
      return publishSnapshot(token, season, week);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['snapshots'] });
    },
  });
}

export function useDeleteSnapshot(token: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ season, week }: { season: number; week: number }) => {
      if (!token) throw new Error('Authentication required');
      return deleteSnapshot(token, season, week);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['snapshots'] });
    },
  });
}

export function useCalculatePredictions(token: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ season, week }: { season: number; week: number }) => {
      if (!token) throw new Error('Authentication required');
      return calculatePredictions(token, season, week);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predictions-summaries'] });
    },
  });
}

export function usePublishPredictions(token: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ season, week }: { season: number; week: number }) => {
      if (!token) throw new Error('Authentication required');
      return publishPredictions(token, season, week);
    },
    onSuccess: (_data, { season, week }) => {
      queryClient.invalidateQueries({ queryKey: ['predictions-summaries'] });
      queryClient.setQueryData(
        ['admin-prediction', season, week],
        (old: AdminPredictionsResponse | undefined) => old && { ...old, isPublished: true },
      );
    },
  });
}

export function useDeletePredictions(token: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ season, week }: { season: number; week: number }) => {
      if (!token) throw new Error('Authentication required');
      return deletePredictions(token, season, week);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predictions-summaries'] });
    },
  });
}

export function useGradePredictions(token: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ season, week }: { season: number; week: number }) => {
      if (!token) throw new Error('Authentication required');
      return gradePredictions(token, season, week);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predictions-summaries'] });
    },
  });
}

export function usePublishGradedResults(token: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ season, week }: { season: number; week: number }) => {
      if (!token) throw new Error('Authentication required');
      return publishGradedResults(token, season, week);
    },
    onSuccess: (_data, { season, week }) => {
      queryClient.invalidateQueries({ queryKey: ['predictions-summaries'] });
      queryClient.setQueryData(
        ['admin-prediction', season, week],
        (old: AdminPredictionsResponse | undefined) =>
          old && { ...old, predictions: { ...old.predictions, resultsPublished: true } },
      );
    },
  });
}

export function useRefreshCache(token: string | null) {
  return useMutation({
    mutationFn: ({ season, week }: { season: number; week: number }) => {
      if (!token) throw new Error('Authentication required');
      return refreshCache(token, season, week);
    },
  });
}

export function useExportSnapshot(token: string | null) {
  return useMutation({
    mutationFn: ({ season, week }: { season: number; week: number }) => {
      if (!token) throw new Error('Authentication required');
      return downloadExport(token, season, week);
    },
  });
}
