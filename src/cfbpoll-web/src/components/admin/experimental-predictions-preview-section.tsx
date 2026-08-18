import { useState } from 'react';

import type { ExperimentalPredictionsResponse } from '../../schemas/admin';

import { getWeekLabel } from '../../lib/week-utils';
import { PredictionsTable } from '../predictions/predictions-table';
import { CollapsibleContent } from '../ui/collapsible-content';
import { CollapsibleTrigger } from '../ui/collapsible-trigger';
import { ExperimentalPredictionsSummarySection } from './experimental-predictions-summary-section';

interface ExperimentalPredictionsPreviewSectionProps {
  calculatedResult: ExperimentalPredictionsResponse;
  season: number;
  week: number;
}

export function ExperimentalPredictionsPreviewSection({
  calculatedResult,
  season,
  week,
}: ExperimentalPredictionsPreviewSectionProps) {
  const [previewExpanded, setPreviewExpanded] = useState(true);

  const { predictions, summary } = calculatedResult;
  const contentId = `experimental-predictions-preview-${season}-${week}`;

  return (
    <div className="bg-surface shadow-md rounded-xl overflow-hidden">
      <div className="p-6 border-b border-border space-y-4">
        <CollapsibleTrigger
          contentId={contentId}
          isOpen={previewExpanded}
          onToggle={() => setPreviewExpanded(!previewExpanded)}
          className="flex items-center gap-2 text-lg font-semibold text-text-primary hover:text-text-secondary"
        >
          Preview ({calculatedResult.algorithmVersion}): {season} {getWeekLabel(week)}
          <span className="text-sm font-normal text-text-muted">
            ({predictions.length} game{predictions.length !== 1 ? 's' : ''})
          </span>
        </CollapsibleTrigger>
        <ExperimentalPredictionsSummarySection summary={summary} />
      </div>
      <CollapsibleContent id={contentId} isOpen={previewExpanded}>
        <PredictionsTable predictions={predictions} showGrades />
      </CollapsibleContent>
    </div>
  );
}
