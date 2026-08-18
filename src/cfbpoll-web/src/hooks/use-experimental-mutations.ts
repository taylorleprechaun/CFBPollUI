import { useMutation } from '@tanstack/react-query';

import type { AlgorithmVersion } from '../components/admin/algorithm-versions';

import { calculateExperimental, calculateExperimentalPredictions, calculateExperimentalSeasonTrends, downloadExperimentalExport } from '../services/admin-api';

export interface ExperimentalParams {
  algorithmVersion: AlgorithmVersion;
  season: number;
  week: number;
}

export interface ExperimentalSeasonTrendsParams {
  algorithmVersion: AlgorithmVersion;
  season: number;
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

export function useCalculateExperimentalSeasonTrends(token: string | null) {
  return useMutation({
    mutationFn: ({ algorithmVersion, season }: ExperimentalSeasonTrendsParams) => {
      if (!token) throw new Error('Authentication required');
      return calculateExperimentalSeasonTrends(token, season, algorithmVersion);
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
