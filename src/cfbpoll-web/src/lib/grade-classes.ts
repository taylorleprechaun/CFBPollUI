const GRADE_CLASSES: Record<string, string> = {
  Correct: 'bg-green-100 dark:bg-green-900/40 text-green-900 dark:text-green-200',
  Incorrect: 'bg-red-100 dark:bg-red-900/40 text-red-900 dark:text-red-200',
  Push: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300',
};

export function gradeClasses(grade: string): string {
  return GRADE_CLASSES[grade] ?? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400';
}
