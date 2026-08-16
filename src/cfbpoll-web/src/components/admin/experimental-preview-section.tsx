import { useState } from 'react';

import type { ExperimentalCalculateResponse } from '../../schemas/admin';

import { getWeekLabel } from '../../lib/week-utils';
import { RankingsTable } from '../rankings/rankings-table';
import { BUTTON_SUCCESS } from '../ui/button-styles';
import { CollapsibleContent } from '../ui/collapsible-content';
import { CollapsibleTrigger } from '../ui/collapsible-trigger';

interface ExperimentalPreviewSectionProps {
  calculatedResult: ExperimentalCalculateResponse;
  isExporting: boolean;
  onExport: () => void;
}

export function ExperimentalPreviewSection({
  calculatedResult,
  isExporting,
  onExport,
}: ExperimentalPreviewSectionProps) {
  const [previewExpanded, setPreviewExpanded] = useState(true);

  const previewRankings = calculatedResult.rankings;
  const contentId = `experimental-preview-${previewRankings.season}-${previewRankings.week}`;

  return (
    <div className="bg-surface shadow-md rounded-xl overflow-hidden">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <CollapsibleTrigger
            contentId={contentId}
            isOpen={previewExpanded}
            onToggle={() => setPreviewExpanded(!previewExpanded)}
            className="flex items-center gap-2 text-lg font-semibold text-text-primary hover:text-text-secondary"
          >
            Preview ({calculatedResult.algorithmVersion}): {previewRankings.season} {getWeekLabel(previewRankings.week)}
          </CollapsibleTrigger>
          <button
            onClick={onExport}
            disabled={isExporting}
            className={BUTTON_SUCCESS}
          >
            {isExporting ? 'Exporting...' : 'Download Excel'}
          </button>
        </div>
      </div>
      <CollapsibleContent id={contentId} isOpen={previewExpanded}>
        <RankingsTable
          rankings={previewRankings.rankings}
          isLoading={false}
          selectedConference={null}
          selectedSeason={previewRankings.season}
          showRatingZScore
        />
      </CollapsibleContent>
    </div>
  );
}
