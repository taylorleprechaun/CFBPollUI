import type { AlgorithmVersion } from '../components/admin/algorithm-versions';
import type { ExperimentalCalculateResponse } from '../schemas/admin';

import { toError } from '../lib/error-utils';
import { useAlgorithmRunState } from './use-algorithm-run-state';
import { useCalculateExperimental } from './use-experimental-mutations';

interface UseExperimentalPageStateOptions {
  selectedSeason: number | null;
  selectedWeek: number | null;
  token: string | null;
}

export function useExperimentalPageState({
  selectedSeason,
  selectedWeek,
  token,
}: UseExperimentalPageStateOptions) {
  const [runState, dispatch] = useAlgorithmRunState<ExperimentalCalculateResponse>();

  const calculateMutation = useCalculateExperimental(token);

  const handleRun = async (versions: AlgorithmVersion[]) => {
    if (selectedSeason === null || selectedWeek === null || versions.length === 0) return;

    dispatch({ type: 'run-start', versions });

    await Promise.allSettled(
      versions.map(async (version) => {
        try {
          const result = await calculateMutation.mutateAsync({
            algorithmVersion: version,
            season: selectedSeason,
            week: selectedWeek,
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
