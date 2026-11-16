import { useQuery } from '@tanstack/react-query';

import { STALE_TIME_ADMIN_PREDICTIONS } from '../lib/query-config';
import { fetchPredictionCalibrationHistory } from '../services/admin-api';

export function usePredictionCalibrationHistory(token: string | null, season: number | null, enabled: boolean) {
  return useQuery({
    queryKey: ['prediction-calibration-history', season],
    queryFn: () => fetchPredictionCalibrationHistory(token!, season!),
    enabled: enabled && token !== null && season !== null,
    staleTime: STALE_TIME_ADMIN_PREDICTIONS,
  });
}
