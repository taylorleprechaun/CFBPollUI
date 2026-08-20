import { useState } from 'react';

import type { AlgorithmRunState } from '../../hooks/use-algorithm-run-state';
import type { ExperimentalPredictionsResponse } from '../../schemas/admin';
import type { AlgorithmVersion } from './algorithm-versions';

import { getWeekLabel } from '../../lib/week-utils';
import { ErrorAlert } from '../error';
import { CollapsibleContent } from '../ui/collapsible-content';
import { CollapsibleTrigger } from '../ui/collapsible-trigger';
import { AlgorithmRunStatusBadge } from './algorithm-run-status-badge';
import { PredictionsComparisonTable } from './predictions-comparison-table';

interface PredictionsComparisonSectionProps {
  runState: AlgorithmRunState<ExperimentalPredictionsResponse>;
  season: number | null;
  selectedVersions: AlgorithmVersion[];
  week: number | null;
}

export function PredictionsComparisonSection({
  runState,
  season,
  selectedVersions,
  week,
}: PredictionsComparisonSectionProps) {
  const [expanded, setExpanded] = useState(true);

  const hasRun = selectedVersions.some((version) => runState[version].status !== 'idle');
  if (!hasRun || season === null || week === null) return null;

  const successfulEntries = selectedVersions
    .filter((version) => runState[version].status === 'success')
    .map((version) => ({ algorithmVersion: version, result: runState[version].result as ExperimentalPredictionsResponse }));

  const contentId = `predictions-comparison-${season}-${week}`;

  return (
    <div className="bg-surface shadow-md rounded-xl overflow-hidden">
      <div className="p-6 border-b border-border">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CollapsibleTrigger
            contentId={contentId}
            isOpen={expanded}
            onToggle={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-lg font-semibold text-text-primary hover:text-text-secondary"
          >
            Comparison: {season} {getWeekLabel(week)}
          </CollapsibleTrigger>
          <div className="flex flex-wrap gap-2">
            {selectedVersions.map((version) => (
              <AlgorithmRunStatusBadge key={version} status={runState[version].status} version={version} />
            ))}
          </div>
        </div>
      </div>
      <CollapsibleContent id={contentId} isOpen={expanded}>
        <div className="p-6 space-y-4">
          {selectedVersions
            .filter((version) => runState[version].status === 'error')
            .map((version) => (
              <ErrorAlert key={version} error={runState[version].error as Error} />
            ))}
          {successfulEntries.length > 0 && (
            <PredictionsComparisonTable entries={successfulEntries} />
          )}
        </div>
      </CollapsibleContent>
    </div>
  );
}
