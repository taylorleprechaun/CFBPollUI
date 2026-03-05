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

export function useExportSnapshot(token: string | null) {
  return useMutation({
    mutationFn: ({ season, week }: { season: number; week: number }) => {
      if (!token) throw new Error('Authentication required');
      return downloadExport(token, season, week);
    },
  });
}
