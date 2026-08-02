export type BadgeColor = 'blue' | 'gray' | 'green' | 'red' | 'yellow';

const BADGE_COLOR_CLASSES: Record<BadgeColor, string> = {
  blue: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300',
  gray: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300',
  green: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300',
  red: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300',
  yellow: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300',
};

export function badgeColorClasses(color: BadgeColor): string {
  return BADGE_COLOR_CLASSES[color];
}
