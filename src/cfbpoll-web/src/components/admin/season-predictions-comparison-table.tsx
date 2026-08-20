import type { SeasonExperimentalPredictionsResponse } from '../../schemas/admin';
import type { AlgorithmVersion } from './algorithm-versions';

import { ExperimentalPredictionsSummarySection } from './experimental-predictions-summary-section';
import { SeasonPredictionsWeekTable } from './season-predictions-week-table';

export interface SeasonPredictionsComparisonEntry {
  algorithmVersion: AlgorithmVersion;
  result: SeasonExperimentalPredictionsResponse;
}

interface SeasonPredictionsComparisonTableProps {
  entries: SeasonPredictionsComparisonEntry[];
}

export function SeasonPredictionsComparisonTable({ entries }: SeasonPredictionsComparisonTableProps) {
  return (
    <div className="overflow-x-auto">
      <div className="flex gap-4 p-1 items-start">
        {entries.map((entry) => (
          <div key={entry.algorithmVersion} className="flex-1 min-w-96 space-y-3">
            <div className="text-sm font-semibold text-text-primary px-1">{entry.algorithmVersion}</div>
            <ExperimentalPredictionsSummarySection summary={entry.result.overallSummary} />
            <SeasonPredictionsWeekTable weeks={entry.result.weeks} />
          </div>
        ))}
      </div>
    </div>
  );
}
