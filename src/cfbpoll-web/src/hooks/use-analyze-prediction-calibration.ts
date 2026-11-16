import { useMutation } from '@tanstack/react-query';

import { analyzePredictionCalibration } from '../services/admin-api';

interface AnalyzePredictionCalibrationParams {
  season: number;
  values: Record<string, number>;
  week: number;
}

/**
 * Grades typed calibration values against every earlier week of the season on demand. A mutation rather
 * than a query because it only runs when asked for; nothing is cached or saved.
 */
export function useAnalyzePredictionCalibration(token: string | null) {
  return useMutation({
    mutationFn: ({ season, values, week }: AnalyzePredictionCalibrationParams) => {
      if (!token) throw new Error('Authentication required');
      return analyzePredictionCalibration(token, season, week, { values });
    },
  });
}
