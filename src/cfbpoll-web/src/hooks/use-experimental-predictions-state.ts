import { useState } from 'react';

import type { AlgorithmVersion } from '../components/admin/algorithm-versions';
import type { ExperimentalPredictionsResponse } from '../schemas/admin';

import { toError } from '../lib/error-utils';
import { useCalculateExperimentalPredictions } from './use-experimental-mutations';

interface UseExperimentalPredictionsStateOptions {
  algorithmVersion: AlgorithmVersion;
  selectedSeason: number | null;
  selectedWeek: number | null;
  token: string | null;
}

export function useExperimentalPredictionsState({
  algorithmVersion,
  selectedSeason,
  selectedWeek,
  token,
}: UseExperimentalPredictionsStateOptions) {
  const [calculatedResult, setCalculatedResult] = useState<ExperimentalPredictionsResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const calculateMutation = useCalculateExperimentalPredictions(token);

  const handleCalculate = async () => {
    if (selectedSeason === null || selectedWeek === null) return;
    setError(null);
    setCalculatedResult(null);

    try {
      const result = await calculateMutation.mutateAsync({
        algorithmVersion,
        season: selectedSeason,
        week: selectedWeek,
      });
      setCalculatedResult(result);
    } catch (err) {
      setError(toError(err, 'Calculation failed'));
    }
  };

  return {
    calculatedResult,
    error,
    handleCalculate,
    isCalculating: calculateMutation.isPending,
  };
}
