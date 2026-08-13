import { useMutation } from '@tanstack/react-query';

import type { AlgorithmVersion } from '../components/admin/algorithm-versions';

import { calculateExperimental, downloadExperimentalExport } from '../services/admin-api';

export interface ExperimentalParams {
  algorithmVersion: AlgorithmVersion;
  season: number;
  week: number;
}

export function useCalculateExperimental(token: string | null) {
  return useMutation({
    mutationFn: ({ algorithmVersion, season, week }: ExperimentalParams) => {
      if (!token) throw new Error('Authentication required');
      return calculateExperimental(token, season, week, algorithmVersion);
    },
  });
}

export function useExportExperimental(token: string | null) {
  return useMutation({
    mutationFn: ({ algorithmVersion, season, week }: ExperimentalParams) => {
      if (!token) throw new Error('Authentication required');
      return downloadExperimentalExport(token, season, week, algorithmVersion);
    },
  });
}
