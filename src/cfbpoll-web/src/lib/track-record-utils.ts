import type { TrackRecordTotals } from '../schemas';

export function formatTotals(totals: TrackRecordTotals): string {
  return totals.push > 0
    ? `${totals.correct}-${totals.incorrect}-${totals.push}`
    : `${totals.correct}-${totals.incorrect}`;
}

export function winPercentage(totals: TrackRecordTotals): number | null {
  const decided = totals.correct + totals.incorrect;
  if (decided === 0) return null;
  return (totals.correct / decided) * 100;
}
