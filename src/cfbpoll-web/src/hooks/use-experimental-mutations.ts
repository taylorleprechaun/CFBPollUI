import { useMutation } from '@tanstack/react-query';

import type { AlgorithmVersion } from '../components/admin/algorithm-versions';

import {
  calculateExperimental,
  calculateExperimentalMatchup,
  calculateExperimentalPredictions,
  calculateExperimentalSeasonPredictions,
  downloadExperimentalExport,
} from '../services/admin-api';

export interface ExperimentalParams {
  algorithmVersion: AlgorithmVersion;
  season: number;
  week: number;
}

export interface ExperimentalMatchupParams extends ExperimentalParams {
  matchup: MatchupInput;
}

export interface MatchupInput {
  awayTeam: string;
  homeTeam: string;
  neutralSite: boolean;
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

export function useCalculateExperimentalMatchup(token: string | null) {
  return useMutation({
    mutationFn: ({ algorithmVersion, matchup, season, week }: ExperimentalMatchupParams) => {
      if (!token) throw new Error('Authentication required');
      return calculateExperimentalMatchup(token, season, week, algorithmVersion, matchup);
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
