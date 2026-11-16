import type { PredictionsComparisonEntry } from '../../lib/predictions-comparison-utils';
import type { AlgorithmVersion } from './algorithm-versions';

import { buildPredictionsComparisonRows } from '../../lib/predictions-comparison-utils';
import { ExperimentalCalibrationNote } from './experimental-calibration-note';
import { ExperimentalPredictionsSummarySection } from './experimental-predictions-summary-section';
import { PredictionsComparisonRow } from './predictions-comparison-row';

interface PredictionsComparisonTableProps {
  entries: PredictionsComparisonEntry[];
  season: number;
  week: number;
}

export function PredictionsComparisonTable({ entries, season, week }: PredictionsComparisonTableProps) {
  const versions: AlgorithmVersion[] = entries.map((entry) => entry.algorithmVersion);
  const rows = buildPredictionsComparisonRows(entries);

  return (
    <div className="overflow-x-auto">
      <div className="flex flex-col gap-3 p-1">
        <div className="flex gap-4">
          <div className="w-72 shrink-0" />
          {entries.map(({ algorithmVersion, result }) => (
            <div key={algorithmVersion} className="flex-1 min-w-72 text-sm font-semibold text-text-primary px-1">
              {algorithmVersion}
              {result.appliedCalibration !== null && (
                <ExperimentalCalibrationNote appliedCalibration={result.appliedCalibration} season={season} week={week} />
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-4">
          <div className="w-72 shrink-0" />
          {entries.map((entry) => (
            <div key={entry.algorithmVersion} className="flex-1 min-w-72">
              <ExperimentalPredictionsSummarySection summary={entry.result.summary} />
            </div>
          ))}
        </div>
        {rows.map((row) => (
          <PredictionsComparisonRow key={row.gameKey} row={row} versions={versions} />
        ))}
      </div>
    </div>
  );
}
