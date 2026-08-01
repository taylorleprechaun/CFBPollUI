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

const STAGE_CLASSES: Record<PredictionStage, string> = {
  draft: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300',
  'picks-published': 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300',
  graded: 'bg-red-100 dark:bg-red-900/40 text-red-900 dark:text-red-200',
  'results-published': 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300',
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
  return STAGE_CLASSES[stage];
}
