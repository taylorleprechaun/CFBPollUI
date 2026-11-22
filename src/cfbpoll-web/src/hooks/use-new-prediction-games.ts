import { useQuery } from '@tanstack/react-query';

import { fetchNewPredictionGames } from '../services/admin-api';

export function useNewPredictionGames(token: string | null, season: number, week: number) {
  return useQuery({
    queryKey: ['new-prediction-games', season, week],
    queryFn: () => fetchNewPredictionGames(token!, season, week),
    enabled: token !== null,
    // Discarded as soon as the modal closes so every check asks the schedule again.
    gcTime: 0,
    staleTime: 0,
  });
}
