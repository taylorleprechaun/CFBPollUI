import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  calculateRankings,
  deleteSnapshot,
  downloadExport,
  publishSnapshot,
} from '../services/admin-api';

export function useCalculateRankings(token: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ season, week }: { season: number; week: number }) =>
      calculateRankings(token!, season, week),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persisted-weeks'] });
    },
  });
}

export function usePublishSnapshot(token: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ season, week }: { season: number; week: number }) =>
      publishSnapshot(token!, season, week),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persisted-weeks'] });
    },
  });
}

export function useDeleteSnapshot(token: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ season, week }: { season: number; week: number }) =>
      deleteSnapshot(token!, season, week),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persisted-weeks'] });
    },
  });
}

export function useExportSnapshot(token: string | null) {
  return useMutation({
    mutationFn: ({ season, week }: { season: number; week: number }) =>
      downloadExport(token!, season, week),
  });
}
