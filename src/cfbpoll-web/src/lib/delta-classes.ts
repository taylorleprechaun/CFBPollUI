import { badgeColorClasses } from './badge-colors';

export function deltaClasses(value: number): string {
  const magnitude = Math.abs(value);

  if (magnitude <= 1) return badgeColorClasses('green');
  if (magnitude <= 3) return badgeColorClasses('yellow');
  return badgeColorClasses('red');
}
