import { useQuery } from '@tanstack/react-query';

import { STALE_TIME_ADMIN_PREDICTIONS } from '../lib/query-config';
import { fetchPredictionCalibration } from '../services/admin-api';

export function usePredictionCalibration(token: string | null, season: number | null, week: number | null) {
  return useQuery({
    queryKey: ['prediction-calibration', season, week],
    queryFn: () => fetchPredictionCalibration(token!, season!, week!),
    enabled: token !== null && season !== null && week !== null,
    staleTime: STALE_TIME_ADMIN_PREDICTIONS,
  });
}
