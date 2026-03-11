import { useQuery } from '@tanstack/react-query';

import { STALE_TIME_SNAPSHOTS } from '../lib/query-config';
import { fetchPredictionsSummaries } from '../services/admin-api';

export function usePredictionsSummaries(token: string | null) {
  return useQuery({
    queryKey: ['predictions-summaries'],
    queryFn: token ? () => fetchPredictionsSummaries(token) : () => Promise.reject(new Error('No token')),
    enabled: token !== null,
    staleTime: STALE_TIME_SNAPSHOTS,
  });
}
