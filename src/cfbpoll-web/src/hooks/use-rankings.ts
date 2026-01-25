import { useQuery } from '@tanstack/react-query';
import { fetchRankings } from '../services/api';

export function useRankings(season: number | null, week: number | null) {
  return useQuery({
    queryKey: ['rankings', season, week],
    queryFn: () => fetchRankings(season!, week!),
    enabled: season !== null && week !== null,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
