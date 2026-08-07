import { useQuery } from '@tanstack/react-query';

import { GC_TIME_DEFAULT, getStaleTime, STALE_TIME_PREDICTIONS } from '../lib/query-config';
import { fetchPredictions } from '../services/api';

export function usePublicPredictions(season: number | null, week: number | null, maxSeason: number | null = null) {
  return useQuery({
    queryKey: ['public-predictions', season, week],
    queryFn: () => fetchPredictions(season!, week!),
    enabled: season !== null && week !== null,
    gcTime: GC_TIME_DEFAULT,
    staleTime: getStaleTime(season, maxSeason, STALE_TIME_PREDICTIONS),
  });
}
