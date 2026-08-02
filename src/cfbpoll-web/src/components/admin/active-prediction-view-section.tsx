import { useState } from 'react';

import { getWeekLabel } from '../../lib/week-utils';
import { PredictionsTable } from '../predictions/predictions-table';
import { BUTTON_PRIMARY } from '../ui/button-styles';
import { CollapsibleContent } from '../ui/collapsible-content';
import { CollapsibleTrigger } from '../ui/collapsible-trigger';
import { FeedbackIndicator } from './feedback-indicator';
import type { ActivePredictionView } from '../../hooks/use-predictions-active-view';
import type { ActionFeedback } from './types';

const SOURCE_LABELS: Record<ActivePredictionView['source'], string | null> = {
  calculated: 'Just Generated',
  graded: 'Just Graded',
  viewed: null,
};

interface ActivePredictionViewSectionProps {
  gradeFeedback: ActionFeedback | null;
  isActionPending: boolean;
  isGrading: boolean;
  onClearGradeFeedback: () => void;
  onClearPublishFeedback: () => void;
  onClearPublishResultsFeedback: () => void;
  onGrade: (season: number, week: number) => void;
  onPublish: (season: number, week: number) => void;
  onPublishResults: (season: number, week: number) => void;
  publishFeedback: ActionFeedback | null;
  publishResultsFeedback: ActionFeedback | null;
  view: ActivePredictionView;
}

export function ActivePredictionViewSection({
  gradeFeedback,
  isActionPending,
  isGrading,
  onClearGradeFeedback,
  onClearPublishFeedback,
  onClearPublishResultsFeedback,
  onGrade,
  onPublish,
  onPublishResults,
  publishFeedback,
  publishResultsFeedback,
  view,
}: ActivePredictionViewSectionProps) {
  const [expanded, setExpanded] = useState(true);

  const { predictions } = view;
  const sourceLabel = SOURCE_LABELS[view.source];
  const showGrade = !view.isGraded;
  const showPublish = !view.isPublished;
  const showPublishResults = view.isGraded && view.isPublished && !view.resultsPublished;
  const gradeKey = `grade-${predictions.season}-${predictions.week}`;
  const publishKey = `active-view-publish-${predictions.season}-${predictions.week}`;
  const publishResultsKey = `publish-results-${predictions.season}-${predictions.week}`;
  const contentId = `active-view-${predictions.season}-${predictions.week}`;

  return (
    <div className="bg-surface shadow-md rounded-xl overflow-hidden">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <CollapsibleTrigger
            contentId={contentId}
            isOpen={expanded}
            onToggle={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-lg font-semibold text-text-primary hover:text-text-secondary"
          >
            {predictions.season} {getWeekLabel(predictions.week)}
            <span className="text-sm font-normal text-text-muted">
              ({predictions.predictions.length} game{predictions.predictions.length !== 1 ? 's' : ''})
            </span>
            {sourceLabel && <span className="text-sm font-normal text-text-muted">&middot; {sourceLabel}</span>}
          </CollapsibleTrigger>
          <div className="flex items-center gap-2">
            {showPublish && (
              <>
                <button
                  onClick={() => onPublish(predictions.season, predictions.week)}
                  disabled={isActionPending}
                  className={BUTTON_PRIMARY}
                >
                  Publish
                </button>
                <FeedbackIndicator feedback={publishFeedback} feedbackKey={publishKey} onClear={onClearPublishFeedback} />
              </>
            )}
            {showGrade && (
              <>
                <button
                  onClick={() => onGrade(predictions.season, predictions.week)}
                  disabled={isActionPending}
                  className={BUTTON_PRIMARY}
                >
                  {isGrading ? 'Grading...' : 'Grade'}
                </button>
                <FeedbackIndicator feedback={gradeFeedback} feedbackKey={gradeKey} onClear={onClearGradeFeedback} />
              </>
            )}
            {showPublishResults && (
              <>
                <button
                  onClick={() => onPublishResults(predictions.season, predictions.week)}
                  disabled={isActionPending}
                  className={BUTTON_PRIMARY}
                >
                  Publish Results
                </button>
                <FeedbackIndicator feedback={publishResultsFeedback} feedbackKey={publishResultsKey} onClear={onClearPublishResultsFeedback} />
              </>
            )}
          </div>
        </div>
        {view.isPersisted === false && (
          <p className="text-amber-600 text-sm mt-2">
            Warning: Predictions were not persisted to the database.
          </p>
        )}
        {(view.unmatchedGameCount ?? 0) > 0 && (
          <p className="text-amber-600 text-sm mt-2">
            Unmatched games: {view.unmatchedGameCount}
          </p>
        )}
      </div>
      <CollapsibleContent id={contentId} isOpen={expanded}>
        <PredictionsTable predictions={predictions.predictions} showGrades={view.isGraded} />
      </CollapsibleContent>
    </div>
  );
}
