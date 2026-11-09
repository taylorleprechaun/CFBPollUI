import { useState } from 'react';

import type { AlgorithmVersion } from '../components/admin/algorithm-versions';
import type { ExperimentalMatchupResponse } from '../schemas/admin';

import { toError } from '../lib/error-utils';
import { useAlgorithmRunState } from './use-algorithm-run-state';
import { type MatchupInput, useCalculateExperimentalMatchup } from './use-experimental-mutations';

export interface SubmittedMatchup extends MatchupInput {
  season: number;
  week: number;
}

interface UseExperimentalMatchupStateOptions {
  selectedSeason: number | null;
  selectedWeek: number | null;
  token: string | null;
}

export function useExperimentalMatchupState({
  selectedSeason,
  selectedWeek,
  token,
}: UseExperimentalMatchupStateOptions) {
  const [submittedMatchup, setSubmittedMatchup] = useState<SubmittedMatchup | null>(null);
  const [runState, dispatch] = useAlgorithmRunState<ExperimentalMatchupResponse>();

  const calculateMutation = useCalculateExperimentalMatchup(token);

  const handleRun = async (versions: AlgorithmVersion[], matchup: MatchupInput) => {
    if (selectedSeason === null || selectedWeek === null || versions.length === 0) return;
    if (!matchup.homeTeam || !matchup.awayTeam || matchup.homeTeam === matchup.awayTeam) return;

    dispatch({ type: 'reset' });
    dispatch({ type: 'run-start', versions });
    setSubmittedMatchup({ ...matchup, season: selectedSeason, week: selectedWeek });

    await Promise.allSettled(
      versions.map(async (version) => {
        try {
          const result = await calculateMutation.mutateAsync({
            algorithmVersion: version,
            matchup,
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
    runState,
    submittedMatchup,
  };
}
