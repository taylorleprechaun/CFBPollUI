import type { BadgeColor } from './badge-colors';

import { badgeColorClasses } from './badge-colors';

export type PredictionStage = 'draft' | 'picks-published' | 'graded' | 'results-published';

interface StageFlags {
  isGraded: boolean;
  isPublished: boolean;
  resultsPublished: boolean;
}

const STAGE_LABELS: Record<PredictionStage, string> = {
  draft: 'Draft',
  'picks-published': 'Picks Published',
  graded: 'Graded',
  'results-published': 'Results Published',
};

const STAGE_COLORS: Record<PredictionStage, BadgeColor> = {
  draft: 'gray',
  'picks-published': 'yellow',
  graded: 'blue',
  'results-published': 'green',
};

export function derivePredictionStage({ isGraded, isPublished, resultsPublished }: StageFlags): PredictionStage {
  if (resultsPublished) return 'results-published';
  if (isGraded) return 'graded';
  if (isPublished) return 'picks-published';
  return 'draft';
}

export function predictionStageLabel(stage: PredictionStage): string {
  return STAGE_LABELS[stage];
}

export function predictionStageClasses(stage: PredictionStage): string {
  return badgeColorClasses(STAGE_COLORS[stage]);
}
