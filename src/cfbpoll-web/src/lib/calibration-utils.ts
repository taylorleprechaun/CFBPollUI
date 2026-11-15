import type { PredictionCalibrationParameter, PredictionCalibrationSource } from '../schemas/admin';

const SOURCE_LABELS: Record<PredictionCalibrationSource, string> = {
  Accepted: 'Accepted suggestion',
  CarriedForward: 'Carried forward',
  Manual: 'Set manually',
};

export function calibrationSourceLabel(source: PredictionCalibrationSource | null, isStored = true): string {
  if (!isStored) return 'Carried forward (not saved yet)';
  return source ? SOURCE_LABELS[source] : 'Unknown';
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
