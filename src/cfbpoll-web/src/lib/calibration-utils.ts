import type { PredictionCalibrationParameter, PredictionCalibrationSource } from '../schemas/admin';

import { getWeekLabel } from './week-utils';

interface CalibrationSourceInfo {
  carriedFromSeason: number | null;
  carriedFromWeek: number | null;
  isStored?: boolean;
  source: PredictionCalibrationSource | null;
}

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
 * Returns why a typed calibration value is invalid for its parameter, or null when it's valid.
 */
export function validateCalibrationInput(raw: string, parameter: PredictionCalibrationParameter): string | null {
  if (raw.trim() === '') return 'A value is required';

  const value = Number(raw);
  if (!Number.isFinite(value)) return 'Enter a number';
  if (value < parameter.min || value > parameter.max) return `Must be between ${parameter.min} and ${parameter.max}`;

  return null;
}
