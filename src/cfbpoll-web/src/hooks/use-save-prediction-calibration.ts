import { useMutation, useQueryClient } from '@tanstack/react-query';

import { invalidateCalibrationAfterSave } from '../lib/calibration-query-utils';
import { savePredictionCalibration } from '../services/admin-api';

interface SavePredictionCalibrationParams {
  isAcceptedSuggestion?: boolean;
  season: number;
  values: Record<string, number>;
  week: number;
}

export function useSavePredictionCalibration(token: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ isAcceptedSuggestion = false, season, values, week }: SavePredictionCalibrationParams) => {
      if (!token) throw new Error('Authentication required');
      return savePredictionCalibration(token, season, week, values, isAcceptedSuggestion);
    },
    onSuccess: (result, { season, week }) => {
      queryClient.setQueryData(['prediction-calibration', season, week], result);
      invalidateCalibrationAfterSave(queryClient, season, week);
    },
  });
}
