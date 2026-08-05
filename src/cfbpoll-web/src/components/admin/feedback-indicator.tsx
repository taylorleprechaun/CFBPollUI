import { SuccessCheckmark } from './success-checkmark';
import type { ActionFeedback } from './types';

interface FeedbackIndicatorProps {
  feedback: ActionFeedback | null;
  feedbackKey: string;
  onClear: () => void;
}

export function FeedbackIndicator({ feedback, feedbackKey, onClear }: FeedbackIndicatorProps) {
  if (feedback?.key !== feedbackKey) return null;

  if (feedback.type === 'success') {
    return (
      <span role="status" className="flex items-center gap-1 text-sm text-green-700">
        <SuccessCheckmark onDone={onClear} />
        {feedback.message}
      </span>
    );
  }

  return <span role="alert" className="text-red-600 text-sm">{feedback.message}</span>;
}
