import { useState } from 'react';

import type { AlgorithmVersion } from '../components/admin/algorithm-versions';
import type { ExperimentalSeasonTrendsResponse } from '../schemas/admin';

import { toError } from '../lib/error-utils';
import { useCalculateExperimentalSeasonTrends } from './use-experimental-mutations';

interface UseExperimentalSeasonTrendsStateOptions {
  algorithmVersion: AlgorithmVersion;
  selectedSeason: number | null;
  token: string | null;
}

export function useExperimentalSeasonTrendsState({
  algorithmVersion,
  selectedSeason,
  token,
}: UseExperimentalSeasonTrendsStateOptions) {
  const [result, setResult] = useState<ExperimentalSeasonTrendsResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const calculateMutation = useCalculateExperimentalSeasonTrends(token);

  const handleCalculate = async () => {
    if (selectedSeason === null) return;
    setError(null);
    setResult(null);

    try {
      const trendsResult = await calculateMutation.mutateAsync({ algorithmVersion, season: selectedSeason });
      setResult(trendsResult);
    } catch (err) {
      setError(toError(err, 'Season trend calculation failed'));
    }
  };

  return {
    error,
    handleCalculate,
    isCalculating: calculateMutation.isPending,
    result,
  };
}
