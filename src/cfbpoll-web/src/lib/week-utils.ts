/**
 * Converts a raw week number to its display label without the rankings "+1" offset,
 * for contexts (like the admin Score Overrides page) that reference the week games
 * were actually played in rather than the rankings week they feed into.
 */
export function getRawWeekLabel(weekNumber: number, isPostseason: boolean): string {
  return isPostseason ? 'Postseason' : `Week ${weekNumber}`;
}

/**
 * Converts a raw week number to its display label.
 * Raw week numbers represent the week games are played;
 * labels reflect rankings after those games, hence the +1 offset.
 */
export function getWeekLabel(week: number): string {
  return `Week ${week + 1}`;
}
