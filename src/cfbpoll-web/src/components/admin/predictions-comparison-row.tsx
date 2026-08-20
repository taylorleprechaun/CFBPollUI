import type { PredictionsComparisonRow as ComparisonRowData } from '../../lib/predictions-comparison-utils';
import type { AlgorithmVersion } from './algorithm-versions';

import { PredictionScoreBlock } from '../predictions/prediction-score-block';
import { PredictionsComparisonColumn } from './predictions-comparison-column';

interface PredictionsComparisonRowProps {
  row: ComparisonRowData;
  versions: AlgorithmVersion[];
}

export function PredictionsComparisonRow({ row, versions }: PredictionsComparisonRowProps) {
  return (
    <div className="flex gap-4">
      <div className="sticky left-0 z-10 bg-surface w-72 shrink-0 h-full border border-border rounded-xl p-4">
        <PredictionScoreBlock prediction={row.base} showGrades showPredictedScore={false} />
      </div>
      {versions.map((version) => (
        <div key={version} className="flex-1 min-w-72">
          <PredictionsComparisonColumn prediction={row.byVersion[version]} />
        </div>
      ))}
    </div>
  );
}
