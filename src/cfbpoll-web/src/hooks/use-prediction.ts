import { useQuery } from '@tanstack/react-query';

import { STALE_TIME_ADMIN_PREDICTIONS } from '../lib/query-config';
import { fetchPrediction } from '../services/admin-api';

export function usePrediction(token: string | null, season: number | null, week: number | null) {
  return useQuery({
    queryKey: ['admin-prediction', season, week],
    queryFn: () => fetchPrediction(token!, season!, week!),
    enabled: token !== null && season !== null && week !== null,
    staleTime: STALE_TIME_ADMIN_PREDICTIONS,
  });
}
