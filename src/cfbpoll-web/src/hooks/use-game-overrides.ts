import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { deleteGameOverride, fetchGameOverrides, saveGameOverride } from '../services/admin-api';

interface SaveGameOverrideVariables {
  gameId: number;
  overrideAwayPoints: number;
  overrideHomePoints: number;
  reason: string;
}

export function useGameOverrides(token: string | null, season: number | null) {
  const queryClient = useQueryClient();
  const queryKey = ['game-overrides', season];

  const query = useQuery({
    queryKey,
    queryFn: () => fetchGameOverrides(token!, season!),
    enabled: token !== null && season !== null,
  });

  const deleteMutation = useMutation({
    mutationFn: (gameId: number) => {
      if (!token) throw new Error('Authentication required');
      return deleteGameOverride(token, gameId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const saveMutation = useMutation({
    mutationFn: ({ gameId, overrideAwayPoints, overrideHomePoints, reason }: SaveGameOverrideVariables) => {
      if (!token || season === null) throw new Error('Authentication required');
      return saveGameOverride(token, gameId, season, overrideHomePoints, overrideAwayPoints, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    ...query,
    deleteOverride: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    isSaving: saveMutation.isPending,
    saveOverride: saveMutation.mutateAsync,
  };
}
