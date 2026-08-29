import { useQuery } from '@tanstack/react-query';

import { STALE_TIME_ADMIN_PREDICTIONS } from '../lib/query-config';
import { fetchPredictionsSummaries } from '../services/admin-api';

export function usePredictionsSummaries(token: string | null) {
  return useQuery({
    queryKey: ['predictions-summaries'],
    queryFn: () => fetchPredictionsSummaries(token!),
    enabled: token !== null,
    staleTime: STALE_TIME_ADMIN_PREDICTIONS,
  });
}
