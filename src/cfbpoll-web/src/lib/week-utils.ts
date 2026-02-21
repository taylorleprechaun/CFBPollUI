/**
 * Converts a raw week number to its display label.
 * Raw week numbers represent the week games are played;
 * labels reflect rankings after those games, hence the +1 offset.
 */
export function getWeekLabel(week: number): string {
  return `Week ${week + 1}`;
}
