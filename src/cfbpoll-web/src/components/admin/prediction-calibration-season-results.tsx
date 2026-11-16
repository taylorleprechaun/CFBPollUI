import { useId, useState } from 'react';

import type { TrackRecordTotals } from '../../schemas';
import type { PredictionCalibrationAnalysis, PredictionCalibrationBacktestWeek, PredictionCalibrationHistoryEntry, PredictionCalibrationParameter, PredictionCalibrationSource } from '../../schemas/admin';
import type { CalibrationChartPoint } from './prediction-calibration-chart';

import { formatCalibrationSummary, formatCalibrationValue, sumRecords } from '../../lib/calibration-utils';
import { getWeekLabel } from '../../lib/week-utils';
import { SELECT_BASE } from '../ui/button-styles';
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
const RECORD_COLUMNS = [
  { key: 'winner', label: 'Winner' },
  { key: 'spread', label: 'Spread' },
  { key: 'overUnder', label: 'O/U' },
] as const;
const SOURCE_TAGS: Record<PredictionCalibrationSource, string> = {
  Accepted: 'Accepted',
  CarriedForward: 'Carried',
  Manual: 'Manual',
};
const TOGGLE_CLASSES = 'px-3 py-1.5 text-sm font-medium transition-colors duration-150';

/**
 * Every completed week of the season, graded with the values it used and with either the values suggested at
 * the time or the admin's typed values, with season totals and a running chart of the difference.
 */
export function PredictionCalibrationSeasonResults({ analysis, comparison, historyEntries, onComparisonChange, parameters }: PredictionCalibrationSeasonResultsProps) {
  const [range, setRange] = useState<RangeChoice>(DEFAULT_RANGE);
  const rangeId = useId();

  const candidateValues = analysis.candidateValues;
  const isHindsight = comparison === 'candidate' && candidateValues !== null;
  const shownWeeks = range === 'season' ? analysis.backtestWeeks : analysis.backtestWeeks.slice(-range);
  const sourceByWeek = new Map(historyEntries.map((e) => [e.week, e.source]));

  function comparedRecord(week: PredictionCalibrationBacktestWeek, key: (typeof RECORD_COLUMNS)[number]['key']): TrackRecordTotals {
    return (isHindsight && week.candidate ? week.candidate : week.suggested)[key];
  }

  function comparedValues(week: PredictionCalibrationBacktestWeek): Record<string, number> {
    return isHindsight && candidateValues ? candidateValues : week.suggestedValues;
  }

  const chartPoints = shownWeeks.reduce<CalibrationChartPoint[]>((points, w) => {
    const previous = points.at(-1) ?? { label: '', overUnder: 0, spread: 0, winner: 0 };
    points.push({
      label: getWeekLabel(w.week).replace('Week ', 'Wk '),
      overUnder: previous.overUnder + comparedRecord(w, 'overUnder').correct - w.used.overUnder.correct,
      spread: previous.spread + comparedRecord(w, 'spread').correct - w.used.spread.correct,
      winner: previous.winner + comparedRecord(w, 'winner').correct - w.used.winner.correct,
    });
    return points;
  }, []);

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
            <div className="inline-flex rounded-lg border border-border overflow-hidden" role="group" aria-label="Compare against">
              <button
                aria-pressed={!isHindsight}
                className={`${TOGGLE_CLASSES} ${!isHindsight ? 'bg-accent text-white' : 'bg-surface text-text-secondary hover:bg-surface-alt'}`}
                onClick={() => onComparisonChange('suggested')}
                type="button"
              >
                Suggestions
              </button>
              <button
                aria-pressed={isHindsight}
                className={`${TOGGLE_CLASSES} ${isHindsight ? 'bg-accent text-white' : 'bg-surface text-text-secondary hover:bg-surface-alt'}`}
                onClick={() => onComparisonChange('candidate')}
                type="button"
              >
                Your values
              </button>
            </div>
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
          <dl className="grid grid-cols-3 gap-3">
            {RECORD_COLUMNS.map((c) => (
              <div key={c.key} className="rounded-lg border border-border p-3">
                <dt className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">{c.label}</dt>
                <dd>
                  <CalibrationRecordChange
                    align="start"
                    compared={sumRecords(shownWeeks.map((w) => comparedRecord(w, c.key)))}
                    used={sumRecords(shownWeeks.map((w) => w.used[c.key]))}
                  />
                </dd>
              </div>
            ))}
          </dl>

          {shownWeeks.length > 1 && <PredictionCalibrationChart points={chartPoints} />}

          <div className="overflow-x-auto">
            <p className="text-xs text-text-muted mb-1">Each cell reads: what you used → {isHindsight ? 'your values' : 'the suggestion at the time'}.</p>
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-surface-alt">
                <tr>
                  <th className={`${HEADER_CLASSES} text-left`}>Week</th>
                  {parameters.map((p) => (
                    <th key={p.key} className={`${HEADER_CLASSES} text-right hidden sm:table-cell`}>{p.label}</th>
                  ))}
                  {RECORD_COLUMNS.map((c) => (
                    <th key={c.key} className={`${HEADER_CLASSES} text-right`}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-border">
                {[...shownWeeks].reverse().map((w) => {
                  const source = sourceByWeek.get(w.week);
                  return (
                    <tr key={`${w.season}-${w.week}`}>
                      <td className={`${CELL_CLASSES} whitespace-nowrap`}>
                        <span className="font-medium text-text-primary">{getWeekLabel(w.week)}</span>
                        {source && <span className="block text-xs text-text-muted">{SOURCE_TAGS[source]}</span>}
                      </td>
                      {parameters.map((p) => (
                        <td key={p.key} className={`${CELL_CLASSES} text-right tabular-nums whitespace-nowrap text-text-secondary hidden sm:table-cell`}>
                          {formatCalibrationValue(w.usedValues[p.key] ?? p.defaultValue)} → {formatCalibrationValue(comparedValues(w)[p.key] ?? p.defaultValue)}
                        </td>
                      ))}
                      {RECORD_COLUMNS.map((c) => (
                        <td key={c.key} className={`${CELL_CLASSES} text-right`}>
                          <CalibrationRecordChange compared={comparedRecord(w, c.key)} used={w.used[c.key]} />
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
