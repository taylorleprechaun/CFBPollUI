import { BUTTON_PRIMARY } from '../ui/button-styles';
import { FeedbackIndicator } from './feedback-indicator';
import type { ActionFeedback } from './types';

interface GradePredictionsSectionProps {
  actionFeedback: ActionFeedback | null;
  isGrading: boolean;
  onClearFeedback: () => void;
  onGrade: () => void;
  selectedSeason: number | null;
  selectedWeek: number | null;
}

export function GradePredictionsSection({
  actionFeedback,
  isGrading,
  onClearFeedback,
  onGrade,
  selectedSeason,
  selectedWeek,
}: GradePredictionsSectionProps) {
  const feedbackKey = `grade-${selectedSeason}-${selectedWeek}`;

  return (
    <div className="bg-surface border border-border rounded-xl p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-text-primary">Grade Results</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onGrade}
            disabled={isGrading || selectedSeason === null || selectedWeek === null}
            className={BUTTON_PRIMARY}
          >
            {isGrading ? 'Grading...' : 'Grade'}
          </button>
          <FeedbackIndicator feedback={actionFeedback} feedbackKey={feedbackKey} onClear={onClearFeedback} />
        </div>
      </div>
    </div>
  );
}
