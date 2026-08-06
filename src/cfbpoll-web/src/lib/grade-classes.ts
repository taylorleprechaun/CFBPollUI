import type { GameGrade } from '../schemas';
import type { BadgeColor } from './badge-colors';

import { badgeColorClasses } from './badge-colors';

const GRADE_COLORS: Partial<Record<GameGrade, BadgeColor>> = {
  Correct: 'green',
  Incorrect: 'red',
  Push: 'gray',
};

// Intentionally distinct from the shared gray so an ungraded/not-applicable
// grade value doesn't visually read as an equivalent "Push" result.
const FALLBACK_CLASSES = 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400';

export function gradeClasses(grade: GameGrade): string {
  const color = GRADE_COLORS[grade];
  return color ? badgeColorClasses(color) : FALLBACK_CLASSES;
}
