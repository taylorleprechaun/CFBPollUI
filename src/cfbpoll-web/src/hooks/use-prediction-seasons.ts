import { useQuery } from '@tanstack/react-query';
import { STALE_TIME_SEASONS } from '../lib/query-config';
import { fetchPredictionSeasons } from '../services/api';

export function usePredictionSeasons() {
  return useQuery({
    queryKey: ['prediction-seasons'],
    queryFn: fetchPredictionSeasons,
    staleTime: STALE_TIME_SEASONS,
  });
}
