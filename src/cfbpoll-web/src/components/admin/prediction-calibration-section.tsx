import { useId, useState } from 'react';

import type { PredictionCalibrationResponse } from '../../schemas/admin';
import type { CalibrationComparison } from './prediction-calibration-season-results';
import type { ActionFeedback } from './types';

import { useAnalyzePredictionCalibration } from '../../hooks/use-analyze-prediction-calibration';
import { usePredictionCalibration } from '../../hooks/use-prediction-calibration';
import { usePredictionCalibrationAnalysis } from '../../hooks/use-prediction-calibration-analysis';
import { usePredictionCalibrationHistory } from '../../hooks/use-prediction-calibration-history';
import { useSavePredictionCalibration } from '../../hooks/use-save-prediction-calibration';
import { calibrationSourceLabel, validateCalibrationInput } from '../../lib/calibration-utils';
import { toErrorMessage } from '../../lib/error-utils';
import { getWeekLabel } from '../../lib/week-utils';
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from '../ui/button-styles';
import { FeedbackIndicator } from './feedback-indicator';
import { PredictionCalibrationSeasonResults } from './prediction-calibration-season-results';
import { PredictionCalibrationValues } from './prediction-calibration-values';

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
  /** True while the values are exactly the suggestion applied with "Use suggested values". */
  fromSuggestion: boolean;
  key: string;
  values: Record<string, string>;
}

const CARD_CLASSES = 'bg-surface border border-border rounded-xl p-4 sm:p-6';

export function PredictionCalibrationSection({ season, token, week }: PredictionCalibrationSectionProps) {
  const [edits, setEdits] = useState<CalibrationEdits | null>(null);
  const [feedback, setFeedback] = useState<ActionFeedback | null>(null);
  const [comparison, setComparison] = useState<CalibrationComparison>('suggested');

  const inputIdPrefix = useId();

  const { data: calibration, error, isLoading } = usePredictionCalibration(token, season, week);
  const isSupported = calibration?.isSupported ?? false;
  const analysisQuery = usePredictionCalibrationAnalysis(token, season, week, isSupported);
  const history = usePredictionCalibrationHistory(token, season, isSupported);
  const saveMutation = useSavePredictionCalibration(token);
  const previewMutation = useAnalyzePredictionCalibration(token);

  const weekTitle = `${season} ${getWeekLabel(week)}`;

  if (isLoading || error || !calibration || !calibration.isSupported) {
    return (
      <section className={CARD_CLASSES}>
        <h2 className="text-lg font-semibold text-text-primary mb-2">{weekTitle}</h2>
        {isLoading && <p className="text-sm text-text-muted">Loading calibration...</p>}
        {error && <p role="alert" className="text-sm text-red-600">{toErrorMessage(error, 'Failed to load calibration')}</p>}
        {calibration && !calibration.isSupported && (
          <p className="text-sm text-text-muted">This season’s prediction algorithm doesn’t take calibration values.</p>
        )}
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
  const analysis = analysisQuery.data;
  // A preview belongs to the week it was run for; switching weeks falls back to the plain analysis.
  const previewIsCurrent = previewMutation.variables?.season === season && previewMutation.variables.week === week;
  const preview = previewIsCurrent && !previewMutation.isPending ? previewMutation.data : undefined;
  const previewError = previewIsCurrent ? previewMutation.error : null;
  const resultsAnalysis = preview ?? analysis;

  function handleApplySuggestion() {
    if (!calibration || !analysis) return;
    const suggested = analysis.suggestedValues;
    setEdits({
      fromSuggestion: true,
      key: editKey,
      values: Object.fromEntries(calibration.parameters.map((p) => [p.key, String(suggested[p.key] ?? p.defaultValue)])),
    });
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setEdits({ fromSuggestion: false, key: editKey, values: { ...inputValues, [name]: value } });
  }

  function handlePreview() {
    if (!calibration) return;
    const values = Object.fromEntries(calibration.parameters.map((p) => [p.key, Number(inputValues[p.key])]));
    setComparison('candidate');
    previewMutation.mutate({ season, values, week });
  }

  async function handleSave() {
    if (!calibration) return;

    const values = Object.fromEntries(calibration.parameters.map((p) => [p.key, Number(inputValues[p.key])]));
    try {
      await saveMutation.mutateAsync({ isAcceptedSuggestion: edits?.key === editKey && edits.fromSuggestion, season, values, week });
      setEdits(null);
      setFeedback({ key: feedbackKey, message: 'Saved', type: 'success' });
    } catch (err) {
      setFeedback({ key: feedbackKey, message: toErrorMessage(err, 'Failed to save calibration'), type: 'error' });
    }
  }

  return (
    <div className="space-y-6">
      <section className={CARD_CLASSES}>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Values for {weekTitle}</h2>
          <p className="text-sm text-text-secondary mt-1">
            {calibrationSourceLabel(calibration)}
            {calibration.isLocked && ' · Locked because this week’s predictions are published'}
          </p>
        </div>

        <PredictionCalibrationValues
          currentValues={calibration.values}
          fieldErrors={fieldErrors}
          inputIdPrefix={inputIdPrefix}
          inputValues={inputValues}
          isLocked={calibration.isLocked}
          isSuggestionLoading={analysisQuery.isLoading}
          onChange={handleInputChange}
          parameters={calibration.parameters}
          suggestedValues={analysis?.suggestedValues}
          suggestionNotes={analysis?.suggestionNotes}
        />

        {!calibration.isLocked && (
          <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-border">
            <button className={BUTTON_SECONDARY} disabled={!analysis} onClick={handleApplySuggestion} type="button">
              Use suggested values
            </button>
            <button className={BUTTON_SECONDARY} disabled={hasErrors || previewMutation.isPending} onClick={handlePreview} type="button">
              {previewMutation.isPending ? 'Testing...' : 'Test my values on past weeks'}
            </button>
            <button className={BUTTON_SECONDARY} disabled={!isDirty} onClick={() => setEdits(null)} type="button">
              Reset
            </button>
            <button
              className={BUTTON_PRIMARY}
              disabled={hasErrors || saveMutation.isPending || (!isDirty && calibration.isStored)}
              onClick={handleSave}
              type="button"
            >
              {saveMutation.isPending ? 'Saving...' : 'Save'}
            </button>
            <FeedbackIndicator feedback={feedback} feedbackKey={feedbackKey} onClear={() => setFeedback(null)} />
          </div>
        )}
      </section>

      <section className={CARD_CLASSES}>
        <h2 className="text-lg font-semibold text-text-primary mb-4">Season so far</h2>
        {previewError && (
          <p role="alert" className="text-sm text-red-600 mb-3">{toErrorMessage(previewError, 'Failed to test your values')}</p>
        )}
        {analysisQuery.isLoading || previewMutation.isPending ? (
          <p className="text-sm text-text-muted">Running the analysis. It replays every past season, so it can take a few seconds.</p>
        ) : analysisQuery.error && !resultsAnalysis ? (
          <p role="alert" className="text-sm text-red-600">{toErrorMessage(analysisQuery.error, 'Failed to run the analysis')}</p>
        ) : resultsAnalysis ? (
          <PredictionCalibrationSeasonResults
            key={`${season}-${week}`}
            analysis={resultsAnalysis}
            comparison={preview ? comparison : 'suggested'}
            historyEntries={history.data ?? []}
            onComparisonChange={setComparison}
            parameters={calibration.parameters}
          />
        ) : null}
      </section>
    </div>
  );
}

function toInputValues(calibration: PredictionCalibrationResponse): Record<string, string> {
  return Object.fromEntries(calibration.parameters.map((p) => [p.key, String(calibration.values[p.key] ?? p.defaultValue)]));
}
