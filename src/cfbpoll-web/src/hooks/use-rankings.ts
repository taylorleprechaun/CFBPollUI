import { useQuery } from '@tanstack/react-query';
import { GC_TIME_DEFAULT, getStaleTime, STALE_TIME_RANKINGS } from '../lib/query-config';
import { fetchRankings } from '../services/api';

export function useRankings(season: number | null, week: number | null, maxSeason: number | null = null) {
  return useQuery({
    queryKey: ['rankings', season, week],
    queryFn: () => fetchRankings(season!, week!),
    enabled: season !== null && week !== null,
    gcTime: GC_TIME_DEFAULT,
    staleTime: getStaleTime(season, maxSeason, STALE_TIME_RANKINGS),
  });
}
