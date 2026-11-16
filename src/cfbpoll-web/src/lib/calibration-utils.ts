import type { TrackRecordTotals } from '../schemas';
import type { PredictionCalibrationParameter, PredictionCalibrationSource, PredictionPickChange } from '../schemas/admin';

import { formatTotals } from './track-record-utils';
import { getWeekLabel } from './week-utils';

interface CalibrationSourceInfo {
  carriedFromSeason: number | null;
  carriedFromWeek: number | null;
  isStored?: boolean;
  /** The season the values apply to, so values carried from the season before can say so. */
  season?: number;
  source: PredictionCalibrationSource | null;
}

interface CalibrationBaselineVerdictInput {
  baseline: CalibrationRecordSet;
  /** When the records cover, e.g. "Over the last 8 weeks". */
  period: string;
  used: CalibrationRecordSet;
}

interface CalibrationVerdictInput {
  compared: CalibrationRecordSet;
  /** When the records cover, e.g. "Over the last 8 weeks". */
  period: string;
  /** Who would have done better or worse, e.g. "following the suggestions". */
  subject: string;
  used: CalibrationRecordSet;
}

export type CalibrationRecordKey = (typeof CALIBRATION_RECORDS)[number]['key'];
export type CalibrationRecordSet = Record<CalibrationRecordKey, TrackRecordTotals>;
export type CalibrationPickChangeSet = Record<CalibrationRecordKey, PredictionPickChange>;

/**
 * The pick records the calibration comparison reports, in the site's standard order.
 */
export const CALIBRATION_RECORDS = [
  { key: 'winner', label: 'Winner', noun: 'winners' },
  { key: 'spread', label: 'Spread', noun: 'spreads' },
  { key: 'overUnder', label: 'O/U', noun: 'over/unders' },
] as const;

/**
 * A sign test p-value below this marks a difference as unlikely to be luck alone.
 */
const NOISE_P_VALUE = 0.05;

const SOURCE_LABELS: Record<Exclude<PredictionCalibrationSource, 'CarriedForward'>, string> = {
  Accepted: 'Accepted suggestion',
  Manual: 'Set manually',
};

/**
 * Link to the Calibration page, opened on a season and optionally a week.
 */
export function calibrationPageUrl(season: number, week?: number): string {
  return week === undefined ? `/admin/calibration?season=${season}` : `/admin/calibration?season=${season}&week=${week}`;
}

/**
 * Describes where a week's calibration values came from. Carried-forward values name the week they
 * were carried from (noting when that was last season), or say they are the defaults when nothing earlier
 * was saved.
 */
export function calibrationSourceLabel({ carriedFromSeason, carriedFromWeek, isStored = true, season, source }: CalibrationSourceInfo): string {
  if (source === null) return 'Unknown';

  if (source !== 'CarriedForward') return SOURCE_LABELS[source];

  const fromLastSeason = season !== undefined && carriedFromSeason === season - 1 ? ' (last season)' : '';
  const origin = carriedFromSeason !== null && carriedFromWeek !== null
    ? `Carried forward from ${carriedFromSeason} ${getWeekLabel(carriedFromWeek)}${fromLastSeason}`
    : 'Defaults (nothing saved earlier)';

  return isStored ? origin : `${origin}, not saved yet`;
}

/**
 * Describes whether a set of changed picks split more unevenly than luck alone would explain.
 */
export function describeNoise(change: PredictionPickChange): string {
  return isWithinNoise(change) ? 'within noise' : 'unlikely to be luck alone';
}

/**
 * Sums up how the values used compare with no calibration, e.g. "Over the last 8 weeks, compared with no
 * calibration, the values used changed correct picks by: Winner 0, Spread +4, O/U -1."
 */
export function formatBaselineVerdict({ baseline, period, used }: CalibrationBaselineVerdictInput): string {
  return `${period}, compared with no calibration, the values used changed correct picks by: ${formatRecordChanges(baseline, used)}.`;
}

/**
 * Lists every parameter with its value, e.g. "Param A +1.5 · Param B -2".
 */
export function formatCalibrationSummary(parameters: PredictionCalibrationParameter[], values: Record<string, number>): string {
  return parameters.map((p) => `${p.label} ${formatCalibrationValue(values[p.key] ?? p.defaultValue)}`).join(' · ');
}

export function formatCalibrationValue(value: number | undefined): string {
  if (value === undefined) return '-';
  return formatSignedNumber(Number(value.toFixed(2)));
}

/**
 * Sums up a comparison in one sentence, e.g. "Over the last 8 weeks, following the suggestions would have
 * changed correct picks by: Winner +3, Spread +8, O/U -1."
 */
export function formatCalibrationVerdict({ compared, period, subject, used }: CalibrationVerdictInput): string {
  return `${period}, ${subject} would have changed correct picks by: ${formatRecordChanges(used, compared)}.`;
}

/**
 * Says whether the records' differences are bigger than luck alone would produce, naming the ones that are.
 */
export function formatNoiseVerdict(changes: CalibrationPickChangeSet): string {
  if (CALIBRATION_RECORDS.every((r) => changes[r.key].changed === 0)) return 'No picks changed.';

  const beyondNoise = CALIBRATION_RECORDS.filter((r) => !isWithinNoise(changes[r.key])).map((r) => r.label);
  if (beyondNoise.length === 0) return 'All of these differences are within what luck alone would produce.';

  const names = beyondNoise.length === 1 ? beyondNoise[0] : `${beyondNoise.slice(0, -1).join(', ')} and ${beyondNoise[beyondNoise.length - 1]}`;
  return `The ${names} ${beyondNoise.length === 1 ? 'difference is' : 'differences are'} unlikely to be luck alone.`;
}

/**
 * Counts the picks that differ and how they split, compared side first, e.g. "7 picks changed, 5-2".
 */
export function formatPickChange(change: PredictionPickChange): string {
  if (change.changed === 0) return 'No picks changed';
  return `${change.changed} ${change.changed === 1 ? 'pick' : 'picks'} changed, ${change.comparedCorrect}-${change.usedCorrect}`;
}

/**
 * Shows a record as used and with a candidate side by side, e.g. "24-26 → 27-23".
 */
export function formatRecordChange(used: TrackRecordTotals, candidate: TrackRecordTotals): string {
  return `${formatTotals(used)} → ${formatTotals(candidate)}`;
}

/**
 * Prefixes positive numbers with a plus sign, e.g. "+3", "0", "-2".
 */
export function formatSignedNumber(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

/**
 * True when the changed picks split evenly enough that luck alone could explain the difference. Pushes are
 * left out. Five or fewer decided picks can never clear the bar.
 */
export function isWithinNoise(change: PredictionPickChange): boolean {
  return signTestPValue(change.comparedCorrect, change.usedCorrect) >= NOISE_P_VALUE;
}

/**
 * How many more picks were correct with the compared values than with the values used (negative when fewer).
 */
export function recordDifference(used: TrackRecordTotals, compared: TrackRecordTotals): number {
  return compared.correct - used.correct;
}

/**
 * Two-sided exact sign test: how likely a split at least this uneven is when each pick is a coin flip.
 */
export function signTestPValue(wins: number, losses: number): number {
  const n = wins + losses;
  if (n === 0) return 1;

  let term = Math.pow(0.5, n);
  let tail = term;
  for (let i = 0; i < Math.min(wins, losses); i++) {
    term = (term * (n - i)) / (i + 1);
    tail += term;
  }

  return Math.min(1, 2 * tail);
}

/**
 * Sums changed picks across weeks.
 */
export function sumPickChanges(changes: PredictionPickChange[]): PredictionPickChange {
  return changes.reduce(
    (total, c) => ({ changed: total.changed + c.changed, comparedCorrect: total.comparedCorrect + c.comparedCorrect, usedCorrect: total.usedCorrect + c.usedCorrect }),
    { changed: 0, comparedCorrect: 0, usedCorrect: 0 }
  );
}

/**
 * Returns why a typed calibration value is invalid for its parameter, or null when it's valid.
 */
export function validateCalibrationInput(raw: string, parameter: PredictionCalibrationParameter): string | null {
  if (raw.trim() === '') return 'A value is required';

  const value = Number(raw);
  if (!Number.isFinite(value)) return 'Enter a number';
  if (value < parameter.min || value > parameter.max) return `Must be between ${parameter.min} and ${parameter.max}`;

  return null;
}

/**
 * Lists each record's change in correct picks from `from` to `to`, e.g. "Winner +3, Spread +8, O/U -1".
 */
function formatRecordChanges(from: CalibrationRecordSet, to: CalibrationRecordSet): string {
  return CALIBRATION_RECORDS.map((r) => `${r.label} ${formatSignedNumber(recordDifference(from[r.key], to[r.key]))}`).join(', ');
}
