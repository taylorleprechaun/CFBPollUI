import type { TrackRecordTotals } from '../schemas';
import type { PredictionCalibrationParameter, PredictionCalibrationSource } from '../schemas/admin';

import { formatTotals } from './track-record-utils';
import { getWeekLabel } from './week-utils';

interface CalibrationSourceInfo {
  carriedFromSeason: number | null;
  carriedFromWeek: number | null;
  isStored?: boolean;
  source: PredictionCalibrationSource | null;
}

interface CalibrationVerdictInput {
  compared: CalibrationRecordSet;
  /** When the records cover, e.g. "Over the last 8 weeks". */
  period: string;
  /** Who would have done better or worse, e.g. "following the suggestions". */
  subject: string;
  used: CalibrationRecordSet;
}

export type CalibrationRecordSet = Record<'overUnder' | 'spread' | 'winner', TrackRecordTotals>;

const SOURCE_LABELS: Record<Exclude<PredictionCalibrationSource, 'CarriedForward'>, string> = {
  Accepted: 'Accepted suggestion',
  Manual: 'Set manually',
};

/**
 * Describes where a week's calibration values came from. Carried-forward values name the week they
 * were carried from, or say they are the defaults when nothing earlier was saved.
 */
export function calibrationSourceLabel({ carriedFromSeason, carriedFromWeek, isStored = true, source }: CalibrationSourceInfo): string {
  if (source === null) return 'Unknown';

  if (source !== 'CarriedForward') return SOURCE_LABELS[source];

  const origin = carriedFromSeason !== null && carriedFromWeek !== null
    ? `Carried forward from ${carriedFromSeason} ${getWeekLabel(carriedFromWeek)}`
    : 'Defaults (nothing saved earlier)';

  return isStored ? origin : `${origin}, not saved yet`;
}

/**
 * Lists every parameter with its value, e.g. "Param A +1.5 · Param B -2".
 */
export function formatCalibrationSummary(parameters: PredictionCalibrationParameter[], values: Record<string, number>): string {
  return parameters.map((p) => `${p.label} ${formatCalibrationValue(values[p.key] ?? p.defaultValue)}`).join(' · ');
}

export function formatCalibrationValue(value: number | undefined): string {
  if (value === undefined) return '-';
  const rounded = Number(value.toFixed(2));
  return rounded > 0 ? `+${rounded}` : `${rounded}`;
}

/**
 * Sums up a comparison in one sentence, e.g. "Over the last 8 weeks, following the suggestions would have
 * changed correct picks by: Winner +3, Spread +8, O/U -1."
 */
export function formatCalibrationVerdict({ compared, period, subject, used }: CalibrationVerdictInput): string {
  const signed = (record: keyof CalibrationRecordSet) => {
    const difference = compared[record].correct - used[record].correct;
    return difference > 0 ? `+${difference}` : `${difference}`;
  };

  return `${period}, ${subject} would have changed correct picks by: Winner ${signed('winner')}, `
    + `Spread ${signed('spread')}, O/U ${signed('overUnder')}.`;
}

/**
 * Shows a record as used and with a candidate side by side, e.g. "24-26 → 27-23".
 */
export function formatRecordChange(used: TrackRecordTotals, candidate: TrackRecordTotals): string {
  return `${formatTotals(used)} → ${formatTotals(candidate)}`;
}

/**
 * Adds records together, e.g. a run of weeks into one total.
 */
export function sumRecords(records: TrackRecordTotals[]): TrackRecordTotals {
  return records.reduce(
    (total, r) => ({ correct: total.correct + r.correct, incorrect: total.incorrect + r.incorrect, push: total.push + r.push }),
    { correct: 0, incorrect: 0, push: 0 }
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
