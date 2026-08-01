import { badgeColorClasses } from './badge-colors';
import type { BadgeColor } from './badge-colors';

const GRADE_COLORS: Record<string, BadgeColor> = {
  Correct: 'green',
  Incorrect: 'red',
  Push: 'gray',
};

// Intentionally distinct from the shared gray so an ungraded/unrecognized
// grade value doesn't visually read as an equivalent "Push" result.
const FALLBACK_CLASSES = 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400';

export function gradeClasses(grade: string): string {
  const color = GRADE_COLORS[grade];
  return color ? badgeColorClasses(color) : FALLBACK_CLASSES;
}
