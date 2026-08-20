import type { AlgorithmVersion } from '../components/admin/algorithm-versions';
import type { SeasonExperimentalPredictionsResponse } from '../schemas/admin';

import { toError } from '../lib/error-utils';
import { useAlgorithmRunState } from './use-algorithm-run-state';
import { useCalculateExperimentalSeasonPredictions } from './use-experimental-mutations';

interface UseExperimentalSeasonPredictionsStateOptions {
  selectedSeason: number | null;
  token: string | null;
}

export function useExperimentalSeasonPredictionsState({
  selectedSeason,
  token,
}: UseExperimentalSeasonPredictionsStateOptions) {
  const [runState, dispatch] = useAlgorithmRunState<SeasonExperimentalPredictionsResponse>();

  const calculateMutation = useCalculateExperimentalSeasonPredictions(token);

  const handleRun = async (versions: AlgorithmVersion[], weeks: number[]) => {
    if (selectedSeason === null || weeks.length === 0 || versions.length === 0) return;

    dispatch({ type: 'run-start', versions });

    await Promise.allSettled(
      versions.map(async (version) => {
        try {
          const result = await calculateMutation.mutateAsync({
            algorithmVersion: version,
            season: selectedSeason,
            weeks,
          });
          dispatch({ result, type: 'run-success', version });
        } catch (err) {
          dispatch({ error: toError(err, `${version} calculation failed`), type: 'run-error', version });
        }
      })
    );
  };

  return {
    handleRun,
    isRunning: Object.values(runState).some((entry) => entry.status === 'pending'),
    reset: () => dispatch({ type: 'reset' }),
    runState,
  };
}
