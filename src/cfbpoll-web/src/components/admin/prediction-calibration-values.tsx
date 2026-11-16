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

const HEADER_CLASSES = 'px-3 py-2 text-xs font-medium text-text-muted uppercase tracking-wider';
const CELL_CLASSES = 'px-3 py-3 align-top text-sm';

/**
 * One row per calibration value: what the week uses now, what's suggested, the editable new value, and how
 * far the new value moves from the current one.
 */
export function PredictionCalibrationValues({ currentValues, fieldErrors, inputIdPrefix, inputValues, isLocked, isSuggestionLoading, onChange, parameters, suggestedValues, suggestionNotes }: PredictionCalibrationValuesProps) {
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead>
            <tr>
              <th className={`${HEADER_CLASSES} text-left`}>Value</th>
              <th className={`${HEADER_CLASSES} text-right`}>Current</th>
              <th className={`${HEADER_CLASSES} text-right`}>Suggested</th>
              <th className={`${HEADER_CLASSES} text-left`}>New value</th>
              <th className={`${HEADER_CLASSES} text-left`}>Change</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {parameters.map((p) => {
              const inputId = `${inputIdPrefix}-${p.key}`;
              const fieldError = fieldErrors[p.key];
              const current = currentValues[p.key] ?? p.defaultValue;
              const typed = Number(inputValues[p.key]);
              const change = fieldError === null ? Number((typed - current).toFixed(2)) : null;

              return (
                <tr key={p.key}>
                  <td className={CELL_CLASSES}>
                    <label htmlFor={inputId} className="font-medium text-text-primary">{p.label}</label>
                    <p className="text-xs text-text-muted max-w-xs">{p.description}</p>
                  </td>
                  <td className={`${CELL_CLASSES} text-right tabular-nums text-text-secondary`}>{formatCalibrationValue(current)}</td>
                  <td className={`${CELL_CLASSES} text-right tabular-nums text-text-secondary`}>
                    {isSuggestionLoading ? <span className="text-text-muted">...</span> : formatCalibrationValue(suggestedValues?.[p.key])}
                  </td>
                  <td className={CELL_CLASSES}>
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
                  </td>
                  <td className={`${CELL_CLASSES} tabular-nums whitespace-nowrap`}>
                    {change === null || change === 0
                      ? <span className="text-text-muted">No change</span>
                      : <span className="font-medium text-text-primary">{change > 0 ? '▲' : '▼'} {Math.abs(change)}</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
