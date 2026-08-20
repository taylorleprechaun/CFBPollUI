import { useMutation } from '@tanstack/react-query';

import type { AlgorithmVersion } from '../components/admin/algorithm-versions';

import {
  calculateExperimental,
  calculateExperimentalPredictions,
  calculateExperimentalSeasonPredictions,
  downloadExperimentalExport,
} from '../services/admin-api';

export interface ExperimentalParams {
  algorithmVersion: AlgorithmVersion;
  season: number;
  week: number;
}

export interface SeasonExperimentalParams {
  algorithmVersion: AlgorithmVersion;
  season: number;
  weeks: number[];
}

export function useCalculateExperimental(token: string | null) {
  return useMutation({
    mutationFn: ({ algorithmVersion, season, week }: ExperimentalParams) => {
      if (!token) throw new Error('Authentication required');
      return calculateExperimental(token, season, week, algorithmVersion);
    },
  });
}

export function useCalculateExperimentalPredictions(token: string | null) {
  return useMutation({
    mutationFn: ({ algorithmVersion, season, week }: ExperimentalParams) => {
      if (!token) throw new Error('Authentication required');
      return calculateExperimentalPredictions(token, season, week, algorithmVersion);
    },
  });
}

export function useCalculateExperimentalSeasonPredictions(token: string | null) {
  return useMutation({
    mutationFn: ({ algorithmVersion, season, weeks }: SeasonExperimentalParams) => {
      if (!token) throw new Error('Authentication required');
      return calculateExperimentalSeasonPredictions(token, season, weeks, algorithmVersion);
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
