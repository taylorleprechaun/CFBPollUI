import type { Query, QueryClient } from '@tanstack/react-query';

const ANALYSIS_KEY = 'prediction-calibration-analysis';
const CALIBRATION_KEY = 'prediction-calibration';
const HISTORY_KEY = 'prediction-calibration-history';

/**
 * Refreshes calibration views after a week's predictions are generated or deleted: the week itself (lock state,
 * draft mismatch, a newly saved carried-forward row), later weeks (their carried-forward origin can change),
 * later weeks' analyses (they read this week's applied values), and the season history.
 */
export function invalidateCalibrationAfterPredictionChange(queryClient: QueryClient, season: number, week: number) {
  queryClient.invalidateQueries({ queryKey: [CALIBRATION_KEY, season, week], exact: true });
  queryClient.invalidateQueries({ predicate: (q) => isLaterWeek(q, CALIBRATION_KEY, season, week) || isLaterWeek(q, ANALYSIS_KEY, season, week) });
  queryClient.invalidateQueries({ queryKey: [HISTORY_KEY, season] });
}

/**
 * Refreshes calibration views after a week's predictions are published: only the week's lock state and the
 * season history change. Analyses don't depend on the published flag, so they're left alone.
 */
export function invalidateCalibrationAfterPublish(queryClient: QueryClient, season: number, week: number) {
  queryClient.invalidateQueries({ queryKey: [CALIBRATION_KEY, season, week], exact: true });
  queryClient.invalidateQueries({ queryKey: [HISTORY_KEY, season] });
}

/**
 * Refreshes calibration views after a week's values are saved. Later weeks, including later seasons, can carry
 * the new values forward, so their views and analyses are refreshed along with the season history. The saved
 * week's own view is updated by the caller from the save response.
 */
export function invalidateCalibrationAfterSave(queryClient: QueryClient, season: number, week: number) {
  queryClient.invalidateQueries({ predicate: (q) => isLaterWeek(q, CALIBRATION_KEY, season, week) || isLaterWeek(q, ANALYSIS_KEY, season, week) });
  queryClient.invalidateQueries({ queryKey: [HISTORY_KEY, season] });
}

/**
 * True when the query is a `[name, season, week]` calibration query for a week after the given one, in the same
 * season or any later season.
 */
function isLaterWeek(query: Query, name: string, season: number, week: number): boolean {
  const [queryName, querySeason, queryWeek] = query.queryKey;
  if (queryName !== name || typeof querySeason !== 'number' || typeof queryWeek !== 'number') return false;

  return querySeason > season || (querySeason === season && queryWeek > week);
}
