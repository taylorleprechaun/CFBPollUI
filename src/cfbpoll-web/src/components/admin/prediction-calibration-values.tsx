import type { PredictionCalibrationParameter } from '../../schemas/admin';

import { formatCalibrationValue } from '../../lib/calibration-utils';

interface PredictionCalibrationValuesProps {
  currentValues: Record<string, number>;
  fieldErrors: Record<string, string | null>;
  inputIdPrefix: string;
  inputValues: Record<string, string>;
  isLocked: boolean;
  isSuggestionLoading: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  parameters: PredictionCalibrationParameter[];
  suggestedValues: Record<string, number> | undefined;
  suggestionNotes: Record<string, string> | undefined;
}

// One wide column for the name and description, then Current, Suggested, New value and Change. Below the
// sm breakpoint each value stacks: the name across the top, the four figures in a 2x2 grid underneath.
const ROW_GRID = 'grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-[minmax(0,2.5fr)_repeat(4,minmax(0,1fr))] sm:items-start';
const HEADER_CLASSES = 'text-xs font-medium text-text-muted uppercase tracking-wider';
const MOBILE_LABEL_CLASSES = 'block text-xs font-medium text-text-muted uppercase tracking-wider mb-0.5 sm:hidden';

/**
 * One row per calibration value: what the week uses now, what's suggested, the editable new value, and how
 * far the new value moves from the current one.
 */
export function PredictionCalibrationValues({ currentValues, fieldErrors, inputIdPrefix, inputValues, isLocked, isSuggestionLoading, onChange, parameters, suggestedValues, suggestionNotes }: PredictionCalibrationValuesProps) {
  return (
    <div className="space-y-4">
      <div className={`${ROW_GRID} hidden sm:grid pb-2 border-b border-border`} aria-hidden="true">
        <span className={HEADER_CLASSES}>Value</span>
        <span className={HEADER_CLASSES}>Current</span>
        <span className={HEADER_CLASSES}>Suggested</span>
        <span className={HEADER_CLASSES}>New value</span>
        <span className={HEADER_CLASSES}>Change</span>
      </div>

      <div className="divide-y divide-border">
        {parameters.map((p) => {
          const inputId = `${inputIdPrefix}-${p.key}`;
          const fieldError = fieldErrors[p.key];
          const current = currentValues[p.key] ?? p.defaultValue;
          const typed = Number(inputValues[p.key]);
          const change = fieldError === null ? Number((typed - current).toFixed(2)) : null;

          return (
            <div key={p.key} aria-label={`${p.label} values`} className={`${ROW_GRID} py-3 first:pt-0 sm:first:pt-3`} role="group">
              <div className="col-span-2 sm:col-span-1">
                <label htmlFor={inputId} className="text-sm font-medium text-text-primary">{p.label}</label>
                <p className="text-xs text-text-muted max-w-prose">{p.description}</p>
              </div>
              <div className="text-sm tabular-nums text-text-secondary">
                <span className={MOBILE_LABEL_CLASSES}>Current</span>
                {formatCalibrationValue(current)}
              </div>
              <div className="text-sm tabular-nums text-text-secondary">
                <span className={MOBILE_LABEL_CLASSES}>Suggested</span>
                {isSuggestionLoading ? <span className="text-text-muted">...</span> : formatCalibrationValue(suggestedValues?.[p.key])}
              </div>
              <div>
                <span className={MOBILE_LABEL_CLASSES}>New value</span>
                <input
                  aria-invalid={fieldError !== null}
                  className="w-24 rounded-lg border border-border-strong bg-surface text-text-primary px-2 py-1 text-sm tabular-nums disabled:bg-surface-alt"
                  disabled={isLocked}
                  id={inputId}
                  max={p.max}
                  min={p.min}
                  name={p.key}
                  onChange={onChange}
                  step={p.step}
                  type="number"
                  value={inputValues[p.key] ?? ''}
                />
                <p className="text-xs text-text-muted mt-1 whitespace-nowrap">Range {p.min} to {p.max}</p>
                {fieldError && <p className="text-xs text-red-600 mt-1">{fieldError}</p>}
              </div>
              <div className="text-sm tabular-nums whitespace-nowrap">
                <span className={MOBILE_LABEL_CLASSES}>Change</span>
                {change === null || change === 0
                  ? <span className="text-text-muted">No change</span>
                  : <span className="font-medium text-text-primary">{change > 0 ? '▲' : '▼'} {Math.abs(change)}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {suggestionNotes && (
        <div className="text-xs text-text-muted max-w-prose space-y-1">
          <p className="font-medium text-text-secondary">How the suggestions were worked out</p>
          <ul className="list-disc pl-4 space-y-1">
            {parameters.map((p) => suggestionNotes[p.key] && <li key={p.key}>{p.label}: {suggestionNotes[p.key]}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
