import type { TrackRecordTotals } from '../schemas';

import { badgeColorClasses } from './badge-colors';
import { winPercentage } from './track-record-utils';

const OVER_UNDER_FAIR_MIN = 49;
const OVER_UNDER_GOOD_MIN = 52;
const SPREAD_FAIR_MIN = 48;
const SPREAD_GOOD_MIN = 51;
const WINNER_FAIR_MIN = 65;
const WINNER_GOOD_MIN = 70;

export function overUnderClasses(totals: TrackRecordTotals): string | null {
  const pct = winPercentage(totals);
  if (pct === null) return null;

  if (pct >= OVER_UNDER_GOOD_MIN) return badgeColorClasses('green');
  if (pct >= OVER_UNDER_FAIR_MIN) return badgeColorClasses('yellow');
  return badgeColorClasses('red');
}

export function spreadClasses(totals: TrackRecordTotals): string | null {
  const pct = winPercentage(totals);
  if (pct === null) return null;

  if (pct >= SPREAD_GOOD_MIN) return badgeColorClasses('green');
  if (pct >= SPREAD_FAIR_MIN) return badgeColorClasses('yellow');
  return badgeColorClasses('red');
}

export function winnerClasses(totals: TrackRecordTotals): string | null {
  const pct = winPercentage(totals);
  if (pct === null) return null;

  if (pct >= WINNER_GOOD_MIN) return badgeColorClasses('green');
  if (pct >= WINNER_FAIR_MIN) return badgeColorClasses('yellow');
  return badgeColorClasses('red');
}
