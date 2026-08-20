import { useState } from 'react';

import type { AlgorithmRunState } from '../../hooks/use-algorithm-run-state';
import type { SeasonExperimentalPredictionsResponse } from '../../schemas/admin';
import type { AlgorithmVersion } from './algorithm-versions';

import { ErrorAlert } from '../error';
import { CollapsibleContent } from '../ui/collapsible-content';
import { CollapsibleTrigger } from '../ui/collapsible-trigger';
import { AlgorithmRunStatusBadge } from './algorithm-run-status-badge';
import { SeasonPredictionsComparisonTable } from './season-predictions-comparison-table';

interface SeasonPredictionsComparisonSectionProps {
  runState: AlgorithmRunState<SeasonExperimentalPredictionsResponse>;
  season: number | null;
  selectedVersions: AlgorithmVersion[];
  weeks: number[];
}

export function SeasonPredictionsComparisonSection({
  runState,
  season,
  selectedVersions,
  weeks,
}: SeasonPredictionsComparisonSectionProps) {
  const [expanded, setExpanded] = useState(true);

  const hasRun = selectedVersions.some((version) => runState[version].status !== 'idle');
  if (!hasRun || season === null || weeks.length === 0) return null;

  const successfulEntries = selectedVersions
    .filter((version) => runState[version].status === 'success')
    .map((version) => ({ algorithmVersion: version, result: runState[version].result as SeasonExperimentalPredictionsResponse }));

  const contentId = `season-predictions-comparison-${season}`;

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
            Season Comparison: {season}
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
            <SeasonPredictionsComparisonTable entries={successfulEntries} />
          )}
        </div>
      </CollapsibleContent>
    </div>
  );
}
