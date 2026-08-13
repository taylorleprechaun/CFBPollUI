import { useState } from 'react';

import type { AlgorithmVersion } from '../components/admin/algorithm-versions';
import type { ExperimentalCalculateResponse } from '../schemas/admin';

import { toError } from '../lib/error-utils';
import { useCalculateExperimental, useExportExperimental } from './use-experimental-mutations';

interface UseExperimentalPageStateOptions {
  algorithmVersion: AlgorithmVersion;
  selectedSeason: number | null;
  selectedWeek: number | null;
  token: string | null;
}

export function useExperimentalPageState({
  algorithmVersion,
  selectedSeason,
  selectedWeek,
  token,
}: UseExperimentalPageStateOptions) {
  const [calculatedResult, setCalculatedResult] = useState<ExperimentalCalculateResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const calculateMutation = useCalculateExperimental(token);
  const exportMutation = useExportExperimental(token);

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

  const handleExport = async () => {
    if (selectedSeason === null || selectedWeek === null) return;
    setError(null);

    try {
      await exportMutation.mutateAsync({
        algorithmVersion,
        season: selectedSeason,
        week: selectedWeek,
      });
    } catch (err) {
      setError(toError(err, 'Export failed'));
    }
  };

  return {
    calculatedResult,
    error,
    handleCalculate,
    handleExport,
    isCalculating: calculateMutation.isPending,
    isExporting: exportMutation.isPending,
  };
}
