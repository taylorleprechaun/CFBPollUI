import { useMutation, useQueryClient } from '@tanstack/react-query';

import { savePredictionCalibration } from '../services/admin-api';

interface SavePredictionCalibrationParams {
  season: number;
  values: Record<string, number>;
  week: number;
}

export function useSavePredictionCalibration(token: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ season, values, week }: SavePredictionCalibrationParams) => {
      if (!token) throw new Error('Authentication required');
      return savePredictionCalibration(token, season, week, values);
    },
    onSuccess: (result, { season, week }) => {
      queryClient.setQueryData(['prediction-calibration', season, week], result);
      queryClient.invalidateQueries({ queryKey: ['prediction-calibration-history', season] });
    },
  });
}
