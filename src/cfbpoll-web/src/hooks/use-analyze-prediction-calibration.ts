import { useMutation } from '@tanstack/react-query';

import { analyzePredictionCalibration } from '../services/admin-api';

interface AnalyzePredictionCalibrationParams {
  backtestWeeks: number;
  season: number;
  values?: Record<string, number>;
  week: number;
}

/**
 * Runs a calibration analysis on demand. A mutation rather than a query because each run replays the
 * whole rating engine and only happens when asked for; nothing is cached or saved.
 */
export function useAnalyzePredictionCalibration(token: string | null) {
  return useMutation({
    mutationFn: ({ backtestWeeks, season, values, week }: AnalyzePredictionCalibrationParams) => {
      if (!token) throw new Error('Authentication required');
      return analyzePredictionCalibration(token, season, week, { backtestWeeks, values });
    },
  });
}
