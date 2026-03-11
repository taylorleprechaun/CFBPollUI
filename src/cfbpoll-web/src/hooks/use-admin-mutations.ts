import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  calculatePredictions,
  calculateRankings,
  deletePredictions,
  deleteSnapshot,
  downloadExport,
  publishPredictions,
  publishSnapshot,
} from '../services/admin-api';

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predictions-summaries'] });
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

export function useExportSnapshot(token: string | null) {
  return useMutation({
    mutationFn: ({ season, week }: { season: number; week: number }) => {
      if (!token) throw new Error('Authentication required');
      return downloadExport(token, season, week);
    },
  });
}
