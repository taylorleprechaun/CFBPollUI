import { useId, useState } from 'react';

import type { CalibrationPickChangeSet, CalibrationRecordKey, CalibrationRecordSet } from '../../lib/calibration-utils';
import type { TrackRecordTotals } from '../../schemas';
import type { PredictionCalibrationAnalysis, PredictionCalibrationBacktestWeek, PredictionCalibrationHistoryEntry, PredictionCalibrationParameter, PredictionCalibrationSource, PredictionPickChange } from '../../schemas/admin';
import type { CalibrationChartPoint } from './prediction-calibration-chart';

import { CALIBRATION_RECORDS, describeNoise, formatBaselineVerdict, formatCalibrationSummary, formatCalibrationValue, formatCalibrationVerdict, formatNoiseVerdict, formatPickChange, recordDifference, sumPickChanges } from '../../lib/calibration-utils';
import { sumTotals } from '../../lib/track-record-utils';
import { getWeekLabel } from '../../lib/week-utils';
import { SELECT_BASE } from '../ui/button-styles';
import { SegmentedToggle } from '../ui/segmented-toggle';
import { CalibrationRecordChange } from './calibration-record-change';
import { PredictionCalibrationChart } from './prediction-calibration-chart';

export type CalibrationComparison = 'candidate' | 'suggested';

interface PredictionCalibrationSeasonResultsProps {
  analysis: PredictionCalibrationAnalysis;
  comparison: CalibrationComparison;
  historyEntries: PredictionCalibrationHistoryEntry[];
  onComparisonChange: (comparison: CalibrationComparison) => void;
  parameters: PredictionCalibrationParameter[];
}

type RangeChoice = number | 'season';

const DEFAULT_RANGE: RangeChoice = 8;
const HEADER_CLASSES = 'px-3 py-2 text-xs font-medium text-text-muted uppercase tracking-wider';
const CELL_CLASSES = 'px-3 py-2 align-top text-sm';
const RANGE_OPTIONS: RangeChoice[] = [2, 4, 6, 8, 'season'];
const COMPARISON_OPTIONS = [
  { label: 'Suggestions', value: 'suggested' },
  { label: 'Your values', value: 'candidate' },
] as const;
const SOURCE_TAGS: Record<PredictionCalibrationSource, string> = {
  Accepted: 'Accepted',
  CarriedForward: 'Carried',
  Kept: 'Kept',
  Manual: 'Manual',
};

/**
 * Every completed week of the season, graded with the values it used and with either the values suggested at
 * the time or the admin's typed values, with a one-line verdict, totals and a per-week chart of the differences.
 */
export function PredictionCalibrationSeasonResults({ analysis, comparison, historyEntries, onComparisonChange, parameters }: PredictionCalibrationSeasonResultsProps) {
  const [range, setRange] = useState<RangeChoice>(DEFAULT_RANGE);
  const rangeId = useId();

  const candidateValues = analysis.candidateValues;
  const isHindsight = comparison === 'candidate' && candidateValues !== null;
  const shownWeeks = range === 'season' ? analysis.backtestWeeks : analysis.backtestWeeks.slice(-range);
  const sourceByWeek = new Map(historyEntries.map((e) => [e.week, e.source]));

  function comparedChange(week: PredictionCalibrationBacktestWeek, key: CalibrationRecordKey): PredictionPickChange {
    return (isHindsight && week.candidateChanges ? week.candidateChanges : week.suggestedChanges)[key];
  }

  function comparedRecord(week: PredictionCalibrationBacktestWeek, key: CalibrationRecordKey): TrackRecordTotals {
    return (isHindsight && week.candidate ? week.candidate : week.suggested)[key];
  }

  function comparedValues(week: PredictionCalibrationBacktestWeek): Record<string, number> {
    return isHindsight && candidateValues ? candidateValues : week.suggestedValues;
  }

  const chartPoints: CalibrationChartPoint[] = shownWeeks.map((w) => ({
    label: getWeekLabel(w.week).replace('Week ', 'Wk '),
    ...(Object.fromEntries(CALIBRATION_RECORDS.map((r) => [r.key, recordDifference(w.used[r.key], comparedRecord(w, r.key))])) as Record<CalibrationRecordKey, number>),
  }));
  const baselineChangeTotals = Object.fromEntries(CALIBRATION_RECORDS.map((r) => [r.key, sumPickChanges(shownWeeks.map((w) => w.baselineChanges[r.key]))])) as CalibrationPickChangeSet;
  const baselineTotals = Object.fromEntries(CALIBRATION_RECORDS.map((r) => [r.key, sumTotals(shownWeeks.map((w) => w.baseline[r.key]))])) as CalibrationRecordSet;
  const comparedChangeTotals = Object.fromEntries(CALIBRATION_RECORDS.map((r) => [r.key, sumPickChanges(shownWeeks.map((w) => comparedChange(w, r.key)))])) as CalibrationPickChangeSet;
  const comparedTotals = Object.fromEntries(CALIBRATION_RECORDS.map((r) => [r.key, sumTotals(shownWeeks.map((w) => comparedRecord(w, r.key)))])) as CalibrationRecordSet;
  const usedTotals = Object.fromEntries(CALIBRATION_RECORDS.map((r) => [r.key, sumTotals(shownWeeks.map((w) => w.used[r.key]))])) as CalibrationRecordSet;
  const period = range === 'season' ? 'So far this season' : shownWeeks.length === 1 ? 'Last week' : `Over the last ${shownWeeks.length} weeks`;
  const verdict = formatCalibrationVerdict({
    compared: comparedTotals,
    period,
    subject: isHindsight ? 'your values' : 'following the suggestions',
    used: usedTotals,
  });
  const baselineVerdict = formatBaselineVerdict({ baseline: baselineTotals, period, used: usedTotals });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-prose">
          <h3 className="text-base font-semibold text-text-primary">
            {isHindsight ? 'How your values would have done (hindsight)' : 'How the suggestions have done this season'}
          </h3>
          <p className="text-sm text-text-secondary mt-1">
            {isHindsight
              ? `Your values (${formatCalibrationSummary(parameters, candidateValues ?? {})}) applied to every past week. You picked them knowing how those weeks went, so this flatters them. Treat it as a rough check.`
              : 'Each week is graded twice: with the values it was generated with, and with the values the suggestion would have given that week using only games played before it. Green means the suggestion would have picked more games right.'}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          {candidateValues !== null && (
            <SegmentedToggle
              ariaLabel="Compare against"
              onChange={onComparisonChange}
              options={COMPARISON_OPTIONS}
              value={isHindsight ? 'candidate' : 'suggested'}
            />
          )}
          <div>
            <label htmlFor={rangeId} className="block text-xs font-medium text-text-muted mb-1">Show</label>
            <select
              className={`px-3 py-1.5 text-sm ${SELECT_BASE}`}
              id={rangeId}
              onChange={(e) => setRange(e.target.value === 'season' ? 'season' : Number(e.target.value))}
              value={range}
            >
              {RANGE_OPTIONS.map((option) => (
                <option key={option} value={option}>{option === 'season' ? 'Season to date' : `Last ${option} weeks`}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {shownWeeks.length === 0 ? (
        <p className="text-sm text-text-muted">No completed weeks this season to compare yet.</p>
      ) : (
        <>
          <div className="rounded-lg border-l-4 border-accent bg-surface-alt px-4 py-3 text-sm text-text-secondary space-y-2 max-w-prose">
            <p>{verdict} {formatNoiseVerdict(comparedChangeTotals)}</p>
            <p>{baselineVerdict} {formatNoiseVerdict(baselineChangeTotals)}</p>
          </div>

          <div>
            <p className="text-xs font-medium text-text-muted mb-2">Totals for the weeks shown</p>
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {CALIBRATION_RECORDS.map((c) => (
                <div key={c.key} className="rounded-lg border border-border p-3">
                  <dt className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">{c.label}</dt>
                  <dd>
                    <CalibrationRecordChange align="start" compared={comparedTotals[c.key]} used={usedTotals[c.key]} />
                    <p className="text-xs text-text-muted mt-1">
                      {formatPickChange(comparedChangeTotals[c.key])}
                      {comparedChangeTotals[c.key].changed > 0 && ` · ${describeNoise(comparedChangeTotals[c.key])}`}
                    </p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {shownWeeks.length > 1 && (
            <PredictionCalibrationChart comparedLabel={isHindsight ? 'your values' : 'the suggestions'} points={chartPoints} />
          )}

          <div className="overflow-x-auto">
            <p className="text-xs text-text-muted mb-1">
              Each cell reads: what you used → {isHindsight ? 'your values' : 'the suggestion at the time'}. “Picks changed, 5-2” counts the picks that differ and how many each side got right, {isHindsight ? 'your values' : 'the suggestion'} first.
            </p>
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-surface-alt">
                <tr>
                  <th className={`${HEADER_CLASSES} text-left`}>Week</th>
                  {parameters.map((p) => (
                    <th key={p.key} className={`${HEADER_CLASSES} text-right hidden sm:table-cell`}>{p.label}</th>
                  ))}
                  {CALIBRATION_RECORDS.map((c) => (
                    <th key={c.key} className={`${HEADER_CLASSES} text-right`}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-border">
                {shownWeeks.map((w) => {
                  const source = sourceByWeek.get(w.week);
                  return (
                    <tr key={`${w.season}-${w.week}`}>
                      <td className={`${CELL_CLASSES} whitespace-nowrap`}>
                        <span className="font-medium text-text-primary">{getWeekLabel(w.week)}</span>
                        {source !== undefined && <span className="block text-xs text-text-muted">{SOURCE_TAGS[source]}</span>}
                        <span className="block text-xs text-text-muted tabular-nums whitespace-normal sm:hidden">
                          {formatCalibrationSummary(parameters, w.usedValues)} → {formatCalibrationSummary(parameters, comparedValues(w))}
                        </span>
                      </td>
                      {parameters.map((p) => (
                        <td key={p.key} className={`${CELL_CLASSES} text-right tabular-nums whitespace-nowrap text-text-secondary hidden sm:table-cell`}>
                          {formatCalibrationValue(w.usedValues[p.key] ?? p.defaultValue)} → {formatCalibrationValue(comparedValues(w)[p.key] ?? p.defaultValue)}
                        </td>
                      ))}
                      {CALIBRATION_RECORDS.map((c) => (
                        <td key={c.key} className={`${CELL_CLASSES} text-right`}>
                          <CalibrationRecordChange change={comparedChange(w, c.key)} compared={comparedRecord(w, c.key)} used={w.used[c.key]} />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
