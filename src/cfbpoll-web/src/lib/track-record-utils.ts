import type { TrackRecordTotals, TrackRecordWeek } from '../schemas';

export const ALL_TIME_TREND_WEEKS = 10;

export interface RecordTrendSummary {
  baselinePct: number;
  direction: 'down' | 'flat' | 'up';
  windowPct: number;
}

export function combineMarginBias(weeks: Pick<TrackRecordWeek, 'marginBias' | 'marginGameCount'>[]): number | null {
  const totalCount = weeks.reduce((sum, w) => sum + w.marginGameCount, 0);
  if (totalCount === 0) return null;
  const sumResidual = weeks.reduce(
    (sum, w) => sum + (w.marginBias !== null ? w.marginBias * w.marginGameCount : 0),
    0
  );
  return sumResidual / totalCount;
}

export function combineMarginRMSE(weeks: Pick<TrackRecordWeek, 'marginRMSE' | 'marginGameCount'>[]): number | null {
  const totalCount = weeks.reduce((sum, w) => sum + w.marginGameCount, 0);
  if (totalCount === 0) return null;
  const sumSquaredError = weeks.reduce(
    (sum, w) => sum + (w.marginRMSE !== null ? w.marginRMSE ** 2 * w.marginGameCount : 0),
    0
  );
  return Math.sqrt(sumSquaredError / totalCount);
}

export function computeRecordTrend(totalsNewestFirst: TrackRecordTotals[], windowWeeks: number): RecordTrendSummary | null {
  // With no weeks outside the window, the window is the baseline and the gap is always 0
  if (totalsNewestFirst.length <= windowWeeks) return null;

  const windowPct = winPercentage(sumTotals(totalsNewestFirst.slice(0, windowWeeks)));
  const baselinePct = winPercentage(sumTotals(totalsNewestFirst));
  if (windowPct === null || baselinePct === null) return null;

  // Compared at the one-decimal precision both percentages are displayed with, so the arrow never contradicts the shown numbers
  const shownWindow = Number(windowPct.toFixed(1));
  const shownBaseline = Number(baselinePct.toFixed(1));
  const direction = shownWindow === shownBaseline ? 'flat' : shownWindow > shownBaseline ? 'up' : 'down';

  return { baselinePct, direction, windowPct };
}

export function formatMarginBias(value: number | null): string {
  if (value === null) return 'N/A';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)} pts`;
}

export function formatMarginRMSE(value: number | null): string {
  return value !== null ? `${value.toFixed(1)} pts` : 'N/A';
}

export function formatTotals(totals: TrackRecordTotals): string {
  return totals.push > 0
    ? `${totals.correct}-${totals.incorrect}-${totals.push}`
    : `${totals.correct}-${totals.incorrect}`;
}

export function sumTotals(totals: TrackRecordTotals[]): TrackRecordTotals {
  return totals.reduce(
    (acc, t) => ({
      correct: acc.correct + t.correct,
      incorrect: acc.incorrect + t.incorrect,
      push: acc.push + t.push,
    }),
    { correct: 0, incorrect: 0, push: 0 }
  );
}

export function winPercentage(totals: TrackRecordTotals): number | null {
  const decided = totals.correct + totals.incorrect;
  if (decided === 0) return null;
  return (totals.correct / decided) * 100;
}
