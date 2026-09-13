import { useQuery } from '@tanstack/react-query';

import { fetchIncompleteGames } from '../services/admin-api';

export function useIncompleteGames(
  token: string | null,
  season: number | null,
  week: number | null,
  enabled: boolean
) {
  return useQuery({
    queryKey: ['incomplete-games', season, week],
    queryFn: () => fetchIncompleteGames(token!, season!, week!),
    enabled: enabled && token !== null && season !== null && week !== null,
  });
}
