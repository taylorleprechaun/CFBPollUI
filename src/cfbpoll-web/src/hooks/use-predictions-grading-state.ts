import { useState } from 'react';

import type { UseMutationResult } from '@tanstack/react-query';

import type { ActionFeedback } from '../components/admin';
import { runMutationWithFeedback } from '../lib/feedback-utils';
import type { GradePredictionsResponse } from '../schemas/admin';
import type { SeasonWeekParams } from './types';

interface UsePredictionsGradingStateOptions {
  gradeMutation: UseMutationResult<GradePredictionsResponse, Error, SeasonWeekParams>;
  publishResultsMutation: UseMutationResult<void, Error, SeasonWeekParams>;
}

export function usePredictionsGradingState({
  gradeMutation,
  publishResultsMutation,
}: UsePredictionsGradingStateOptions) {
  const [gradedResult, setGradedResult] = useState<GradePredictionsResponse | null>(null);
  const [actionFeedback, setActionFeedback] = useState<ActionFeedback | null>(null);

  const clearFeedback = () => setActionFeedback(null);
  const clearGradedResult = () => setGradedResult(null);

  const handleGrade = async (season: number, week: number) => {
    await runMutationWithFeedback({
      errorFallback: 'Grading failed',
      key: `grade-${season}-${week}`,
      mutate: () => gradeMutation.mutateAsync({ season, week }),
      onSuccess: setGradedResult,
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
    clearGradedResult,
    gradedResult,
    handleGrade,
    handlePublishResults,
    isGrading: gradeMutation.isPending,
    isPublishingResults: publishResultsMutation.isPending,
  };
}
