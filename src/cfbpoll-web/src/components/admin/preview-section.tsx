import { useState } from 'react';

import type { CalculateResponse } from '../../schemas/admin';
import type { ActionFeedback } from './types';

import { getWeekLabel } from '../../lib/week-utils';
import { RankingsTable } from '../rankings/rankings-table';
import { BUTTON_PRIMARY, BUTTON_SUCCESS } from '../ui/button-styles';
import { CollapsibleContent } from '../ui/collapsible-content';
import { CollapsibleTrigger } from '../ui/collapsible-trigger';
import { FeedbackIndicator } from './feedback-indicator';

interface PreviewSectionProps {
  actionFeedback: ActionFeedback | null;
  calculatedResult: CalculateResponse;
  isActionPending: boolean;
  onClearFeedback: () => void;
  onExport: (season: number, week: number) => void;
  onPublish: (season: number, week: number) => void;
}

export function PreviewSection({
  calculatedResult,
  actionFeedback,
  isActionPending,
  onClearFeedback,
  onExport,
  onPublish,
}: PreviewSectionProps) {
  const [previewExpanded, setPreviewExpanded] = useState(true);

  const previewRankings = calculatedResult.rankings;
  const previewPublishKey = `preview-publish-${previewRankings.season}-${previewRankings.week}`;
  const contentId = `preview-${previewRankings.season}-${previewRankings.week}`;

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
            Preview: {previewRankings.season} {getWeekLabel(previewRankings.week)}
          </CollapsibleTrigger>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onExport(previewRankings.season, previewRankings.week)}
              disabled={isActionPending}
              className={BUTTON_SUCCESS}
            >
              Download Excel
            </button>
            <button
              onClick={() => onPublish(previewRankings.season, previewRankings.week)}
              disabled={isActionPending}
              className={BUTTON_PRIMARY}
            >
              Publish
            </button>
            <FeedbackIndicator feedback={actionFeedback} feedbackKey={previewPublishKey} onClear={onClearFeedback} />
          </div>
        </div>
        {!calculatedResult.isPersisted && (
          <p className="text-amber-600 text-sm mt-2">
            Warning: Rankings were not persisted to the database.
          </p>
        )}
      </div>
      <CollapsibleContent id={contentId} isOpen={previewExpanded}>
        <RankingsTable
          rankings={previewRankings.rankings}
          isLoading={false}
          selectedConference={null}
          selectedSeason={previewRankings.season}
        />
      </CollapsibleContent>
    </div>
  );
}
