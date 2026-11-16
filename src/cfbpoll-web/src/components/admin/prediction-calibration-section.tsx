import { useId, useState } from 'react';

import type { PredictionCalibrationResponse } from '../../schemas/admin';
import type { ActionFeedback } from './types';

import { usePredictionCalibration } from '../../hooks/use-prediction-calibration';
import { usePredictionCalibrationHistory } from '../../hooks/use-prediction-calibration-history';
import { useSavePredictionCalibration } from '../../hooks/use-save-prediction-calibration';
import { calibrationSourceLabel, formatCalibrationValue, validateCalibrationInput } from '../../lib/calibration-utils';
import { toErrorMessage } from '../../lib/error-utils';
import { getWeekLabel } from '../../lib/week-utils';
import { BUTTON_GHOST, BUTTON_PRIMARY, BUTTON_SECONDARY } from '../ui/button-styles';
import { FeedbackIndicator } from './feedback-indicator';
import { PredictionCalibrationHistory } from './prediction-calibration-history';

interface PredictionCalibrationSectionProps {
  season: number;
  token: string | null;
  week: number;
}

/**
 * Unsaved edits, tagged with the calibration version they were typed against so they are
 * discarded automatically when the selected week changes or a save replaces the values.
 */
interface CalibrationEdits {
  key: string;
  values: Record<string, string>;
}

const SECTION_CLASSES = 'bg-surface border border-border rounded-xl p-4 sm:p-6';

export function PredictionCalibrationSection({ season, token, week }: PredictionCalibrationSectionProps) {
  const [edits, setEdits] = useState<CalibrationEdits | null>(null);
  const [feedback, setFeedback] = useState<ActionFeedback | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const inputIdPrefix = useId();

  const { data: calibration, error, isLoading } = usePredictionCalibration(token, season, week);
  const history = usePredictionCalibrationHistory(token, season, isHistoryOpen && (calibration?.isSupported ?? false));
  const saveMutation = useSavePredictionCalibration(token);

  const heading = <h2 className="text-lg font-semibold text-text-primary mb-2">{season} {getWeekLabel(week)}</h2>;

  if (isLoading) {
    return (
      <section className={SECTION_CLASSES}>
        {heading}
        <p className="text-sm text-text-muted">Loading calibration...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className={SECTION_CLASSES}>
        {heading}
        <p role="alert" className="text-sm text-red-600">{toErrorMessage(error, 'Failed to load calibration')}</p>
      </section>
    );
  }

  if (!calibration) return null;

  if (!calibration.isSupported) {
    return (
      <section className={SECTION_CLASSES}>
        {heading}
        <p className="text-sm text-text-muted">This season’s prediction algorithm doesn’t take calibration values.</p>
      </section>
    );
  }

  const editKey = `${season}-${week}-${calibration.updatedAt ?? 'unsaved'}`;
  const inputValues = edits?.key === editKey ? edits.values : toInputValues(calibration);
  const fieldErrors = Object.fromEntries(
    calibration.parameters.map((p) => [p.key, validateCalibrationInput(inputValues[p.key] ?? '', p)])
  );
  const hasErrors = Object.values(fieldErrors).some((e) => e !== null);
  const isDirty = calibration.parameters.some((p) => Number(inputValues[p.key]) !== calibration.values[p.key]);
  const feedbackKey = `prediction-calibration-${season}-${week}`;

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setEdits({ key: editKey, values: { ...inputValues, [name]: value } });
  }

  async function handleSave() {
    if (!calibration) return;

    const values = Object.fromEntries(calibration.parameters.map((p) => [p.key, Number(inputValues[p.key])]));
    try {
      await saveMutation.mutateAsync({ season, values, week });
      setEdits(null);
      setFeedback({ key: feedbackKey, message: 'Saved', type: 'success' });
    } catch (err) {
      setFeedback({ key: feedbackKey, message: toErrorMessage(err, 'Failed to save calibration'), type: 'error' });
    }
  }

  return (
    <section className={SECTION_CLASSES}>
      {heading}
      <p className="text-sm text-text-secondary mb-4">
        {calibrationSourceLabel(calibration)}
        {calibration.isLocked && ' · Locked because this week’s predictions are published'}
      </p>

      <div className="space-y-3">
        {calibration.parameters.map((p) => {
          const inputId = `${inputIdPrefix}-${p.key}`;
          const fieldError = fieldErrors[p.key];

          return (
            <div key={p.key} className="flex flex-wrap items-start gap-x-4 gap-y-1">
              <div className="w-full sm:w-64">
                <label htmlFor={inputId} className="text-sm font-medium text-text-primary">{p.label}</label>
                <p className="text-xs text-text-muted">{p.description}</p>
              </div>
              <div>
                <input
                  aria-invalid={fieldError !== null}
                  className="w-28 rounded-lg border border-border-strong bg-surface text-text-primary px-2 py-1 text-sm tabular-nums disabled:bg-surface-alt"
                  disabled={calibration.isLocked}
                  id={inputId}
                  max={p.max}
                  min={p.min}
                  name={p.key}
                  onChange={handleInputChange}
                  step={p.step}
                  type="number"
                  value={inputValues[p.key] ?? ''}
                />
                <p className="text-xs text-text-muted mt-1">
                  Default {formatCalibrationValue(p.defaultValue)}, range {p.min} to {p.max}
                </p>
                {fieldError && <p className="text-xs text-red-600 mt-1">{fieldError}</p>}
              </div>
            </div>
          );
        })}
      </div>

      {!calibration.isLocked && (
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <button
            className={BUTTON_PRIMARY}
            disabled={hasErrors || saveMutation.isPending || (!isDirty && calibration.isStored)}
            onClick={handleSave}
            type="button"
          >
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </button>
          <button className={BUTTON_SECONDARY} disabled={!isDirty} onClick={() => setEdits(null)} type="button">
            Reset
          </button>
          <FeedbackIndicator feedback={feedback} feedbackKey={feedbackKey} onClear={() => setFeedback(null)} />
        </div>
      )}

      <div className="mt-4">
        <button
          aria-expanded={isHistoryOpen}
          className={BUTTON_GHOST}
          onClick={() => setIsHistoryOpen((prev) => !prev)}
          type="button"
        >
          {isHistoryOpen ? 'Hide season history' : 'Show season history'}
        </button>
        {isHistoryOpen && (
          <div className="mt-2">
            <PredictionCalibrationHistory
              entries={history.data ?? []}
              isLoading={history.isLoading}
              parameters={calibration.parameters}
            />
          </div>
        )}
      </div>
    </section>
  );
}

function toInputValues(calibration: PredictionCalibrationResponse): Record<string, string> {
  return Object.fromEntries(calibration.parameters.map((p) => [p.key, String(calibration.values[p.key] ?? p.defaultValue)]));
}
