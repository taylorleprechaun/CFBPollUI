import { useQuery } from '@tanstack/react-query';
import { STALE_TIME_RANKINGS } from '../lib/query-config';
import { fetchRankings } from '../services/api';

export function useRankings(season: number | null, week: number | null) {
  return useQuery({
    queryKey: ['rankings', season, week],
    queryFn: () => fetchRankings(season!, week!),
    enabled: season !== null && week !== null,
    staleTime: STALE_TIME_RANKINGS,
  });
}
