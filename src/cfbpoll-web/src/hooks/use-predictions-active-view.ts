import { useCallback, useMemo, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';

import { usePrediction } from './use-prediction';
import type {
  AdminPredictionsResponse,
  CalculatePredictionsResponse,
  GradePredictionsResponse,
  PredictionsResponse,
} from '../schemas/admin';

export type PredictionViewSource = 'calculated' | 'graded' | 'viewed';

interface ActiveViewMeta {
  isPersisted: boolean;
  season: number;
  source: 'calculated' | 'graded';
  unmatchedGameCount?: number;
  week: number;
}

export interface ActivePredictionView {
  isGraded: boolean;
  isPersisted: boolean | null;
  isPublished: boolean;
  predictions: PredictionsResponse;
  resultsPublished: boolean;
  season: number;
  source: PredictionViewSource;
  unmatchedGameCount: number | null;
  week: number;
}

export function usePredictionsActiveView(token: string | null) {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [meta, setMeta] = useState<ActiveViewMeta | null>(null);

  const seasonParam = searchParams.get('season');
  const weekParam = searchParams.get('week');
  const season = seasonParam ? Number(seasonParam) : null;
  const week = weekParam ? Number(weekParam) : null;

  const query = usePrediction(token, season, week);

  const setActiveParams = useCallback((s: number, w: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('season', String(s));
      next.set('week', String(w));
      return next;
    });
  }, [setSearchParams]);

  const showView = useCallback((s: number, w: number) => {
    setMeta(null);
    setActiveParams(s, w);
  }, [setActiveParams]);

  const applyCalculated = useCallback((result: CalculatePredictionsResponse) => {
    const { season: s, week: w } = result.predictions;
    queryClient.setQueryData(['admin-prediction', s, w], { isPublished: false, predictions: result.predictions });
    setMeta({ isPersisted: result.isPersisted, season: s, source: 'calculated', week: w });
    setActiveParams(s, w);
  }, [queryClient, setActiveParams]);

  const applyGraded = useCallback((result: GradePredictionsResponse) => {
    const { season: s, week: w } = result.predictions;
    queryClient.setQueryData(
      ['admin-prediction', s, w],
      (old: AdminPredictionsResponse | undefined) => ({ isPublished: old?.isPublished ?? false, predictions: result.predictions }),
    );
    setMeta({
      isPersisted: result.isPersisted,
      season: s,
      source: 'graded',
      unmatchedGameCount: result.unmatchedGameCount,
      week: w,
    });
    setActiveParams(s, w);
  }, [queryClient, setActiveParams]);

  const clearIfMatches = useCallback((s: number, w: number) => {
    if (season !== s || week !== w) return;

    setMeta(null);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('season');
      next.delete('week');
      return next;
    }, { replace: true });
  }, [season, week, setSearchParams]);

  const view: ActivePredictionView | null = useMemo(() => {
    if (!query.data || season === null || week === null) return null;

    const freshMeta = meta && meta.season === season && meta.week === week ? meta : null;

    return {
      isGraded: query.data.predictions.isGraded,
      isPersisted: freshMeta ? freshMeta.isPersisted : null,
      // Always read live from the query cache rather than masking it while freshMeta is set -
      // the cache is kept accurate through every transition (generate, grade, publish), and a
      // week can be published/graded more than once within the same session without navigating
      // away, so "haven't left the page" must not be conflated with "definitely unpublished".
      isPublished: query.data.isPublished,
      predictions: query.data.predictions,
      resultsPublished: query.data.predictions.resultsPublished,
      season,
      source: freshMeta ? freshMeta.source : 'viewed',
      unmatchedGameCount: freshMeta?.unmatchedGameCount ?? null,
      week,
    };
  }, [query.data, meta, season, week]);

  return {
    applyCalculated,
    applyGraded,
    clearIfMatches,
    error: query.error,
    isLoading: query.isLoading,
    season,
    showView,
    view,
    week,
  };
}
