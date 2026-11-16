import { useQuery } from '@tanstack/react-query';

import { STALE_TIME_ADMIN_PREDICTIONS } from '../lib/query-config';
import { analyzePredictionCalibration } from '../services/admin-api';

/**
 * Loads a week's suggested calibration values and how every earlier week of the season did with the
 * values it used compared with the values suggested at the time. Each run replays the rating engine, so
 * results are kept for the admin stale time.
 */
export function usePredictionCalibrationAnalysis(token: string | null, season: number | null, week: number | null, enabled: boolean) {
  return useQuery({
    queryKey: ['prediction-calibration-analysis', season, week],
    queryFn: () => analyzePredictionCalibration(token!, season!, week!, {}),
    enabled: enabled && token !== null && season !== null && week !== null,
    staleTime: STALE_TIME_ADMIN_PREDICTIONS,
  });
}
