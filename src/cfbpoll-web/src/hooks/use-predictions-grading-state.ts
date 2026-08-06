import type { UseMutationResult } from '@tanstack/react-query';

import { useState } from 'react';

import type { ActionFeedback } from '../components/admin';
import type { GradePredictionsResponse } from '../schemas/admin';
import type { SeasonWeekParams } from './types';

import { runMutationWithFeedback } from '../lib/feedback-utils';

interface UsePredictionsGradingStateOptions {
  gradeMutation: UseMutationResult<GradePredictionsResponse, Error, SeasonWeekParams>;
  onGradeSuccess: (result: GradePredictionsResponse) => void;
  publishResultsMutation: UseMutationResult<void, Error, SeasonWeekParams>;
}

export function usePredictionsGradingState({
  gradeMutation,
  onGradeSuccess,
  publishResultsMutation,
}: UsePredictionsGradingStateOptions) {
  const [actionFeedback, setActionFeedback] = useState<ActionFeedback | null>(null);

  const clearFeedback = () => setActionFeedback(null);

  const handleGrade = async (season: number, week: number) => {
    await runMutationWithFeedback({
      errorFallback: 'Grading failed',
      key: `grade-${season}-${week}`,
      mutate: () => gradeMutation.mutateAsync({ season, week }),
      onSuccess: onGradeSuccess,
      setFeedback: setActionFeedback,
    });
  };

  const handlePublishResults = async (season: number, week: number) => {
    await runMutationWithFeedback({
      errorFallback: 'Publish failed',
      key: `publish-results-${season}-${week}`,
      mutate: () => publishResultsMutation.mutateAsync({ season, week }),
      setFeedback: setActionFeedback,
    });
  };

  return {
    actionFeedback,
    clearFeedback,
    handleGrade,
    handlePublishResults,
    isGrading: gradeMutation.isPending,
    isPublishingResults: publishResultsMutation.isPending,
  };
}
