import type { TrackRecordTotals, TrackRecordWeek } from '../schemas';

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
