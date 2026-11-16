import type { PredictionCalibrationAnalysis, PredictionCalibrationParameter } from '../../schemas/admin';

import { formatCalibrationSummary, formatCalibrationValue, formatRecordChange } from '../../lib/calibration-utils';
import { getWeekLabel } from '../../lib/week-utils';
import { BUTTON_SECONDARY } from '../ui/button-styles';

interface PredictionCalibrationAnalysisProps {
  analysis: PredictionCalibrationAnalysis;
  canApply: boolean;
  candidateLabel: string;
  onApplySuggestion: (values: Record<string, number>) => void;
  parameters: PredictionCalibrationParameter[];
}

const HEADER_CLASSES = 'px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider';
const CELL_CLASSES = 'px-4 py-3 whitespace-nowrap text-sm text-text-secondary';

export function PredictionCalibrationAnalysis({ analysis, canApply, candidateLabel, onApplySuggestion, parameters }: PredictionCalibrationAnalysisProps) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <h3 className="text-base font-semibold text-text-primary">Suggested values</h3>
          {canApply && (
            <button className={BUTTON_SECONDARY} onClick={() => onApplySuggestion(analysis.suggestedValues)} type="button">
              Use suggested values
            </button>
          )}
        </div>
        <ul className="space-y-2">
          {parameters.map((p) => (
            <li key={p.key} className="text-sm">
              <span className="font-medium text-text-primary">{p.label} {formatCalibrationValue(analysis.suggestedValues[p.key])}</span>
              <span className="block text-xs text-text-muted max-w-prose">{analysis.suggestionNotes[p.key]}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-base font-semibold text-text-primary">
          Last {analysis.backtestWeeks.length} {analysis.backtestWeeks.length === 1 ? 'week' : 'weeks'}: as used vs {candidateLabel}
        </h3>
        <p className="text-xs text-text-muted mb-2 max-w-prose">
          {candidateLabel}: {formatCalibrationSummary(parameters, analysis.candidateValues)}. Both records are recomputed against
          actual results from today’s data, so the as-used record can differ slightly from what was published.
        </p>
        {analysis.backtestWeeks.length === 0 ? (
          <p className="text-sm text-text-muted">No completed weeks this season to compare yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-surface-alt">
                <tr>
                  <th className={`${HEADER_CLASSES} text-left`}>Week</th>
                  <th className={`${HEADER_CLASSES} text-left`}>Values used</th>
                  <th className={`${HEADER_CLASSES} text-right`}>Winner</th>
                  <th className={`${HEADER_CLASSES} text-right`}>Spread</th>
                  <th className={`${HEADER_CLASSES} text-right`}>O/U</th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-border">
                {analysis.backtestWeeks.map((w) => (
                  <tr key={`${w.season}-${w.week}`} className="even:bg-surface-alt/50">
                    <td className={`${CELL_CLASSES} text-text-primary`}>{getWeekLabel(w.week)}</td>
                    <td className={CELL_CLASSES}>{formatCalibrationSummary(parameters, w.usedValues)}</td>
                    <td className={`${CELL_CLASSES} text-right tabular-nums`}>{formatRecordChange(w.used.winner, w.candidate.winner)}</td>
                    <td className={`${CELL_CLASSES} text-right tabular-nums`}>{formatRecordChange(w.used.spread, w.candidate.spread)}</td>
                    <td className={`${CELL_CLASSES} text-right tabular-nums`}>{formatRecordChange(w.used.overUnder, w.candidate.overUnder)}</td>
                  </tr>
                ))}
                <tr className="font-medium">
                  <td className={`${CELL_CLASSES} text-text-primary`} colSpan={2}>Total</td>
                  <td className={`${CELL_CLASSES} text-right tabular-nums`}>{formatRecordChange(analysis.usedTotal.winner, analysis.candidateTotal.winner)}</td>
                  <td className={`${CELL_CLASSES} text-right tabular-nums`}>{formatRecordChange(analysis.usedTotal.spread, analysis.candidateTotal.spread)}</td>
                  <td className={`${CELL_CLASSES} text-right tabular-nums`}>{formatRecordChange(analysis.usedTotal.overUnder, analysis.candidateTotal.overUnder)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

