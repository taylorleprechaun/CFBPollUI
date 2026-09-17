import { useQuery } from '@tanstack/react-query';

import { fetchCompletedGames } from '../services/admin-api';

export function useCompletedGames(
  token: string | null,
  season: number | null,
  week: number | null,
  enabled: boolean
) {
  return useQuery({
    queryKey: ['completed-games', season, week],
    queryFn: () => fetchCompletedGames(token!, season!, week!),
    enabled: enabled && token !== null && season !== null && week !== null,
  });
}
