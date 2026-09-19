/**
 * Converts a raw week number to its display label without the rankings "+1" offset,
 * for contexts (like the admin Score Overrides page) that reference the week games
 * were actually played in rather than the rankings week they feed into.
 */
export function getRawWeekLabel(weekNumber: number, isPostseason: boolean): string {
  return isPostseason ? 'Postseason' : `Week ${weekNumber}`;
}

/**
 * Labels a score override by the week its game was actually played in (no rankings "+1" offset),
 * or "Postseason" for postseason games, whose week number restarts.
 */
export function getScoreOverrideWeekLabel(override: { seasonType?: string; week: number }): string {
  return getRawWeekLabel(override.week, override.seasonType?.toLowerCase() === 'postseason');
}

/**
 * Converts a raw week number to its display label.
 * Raw week numbers represent the week games are played;
 * labels reflect rankings after those games, hence the +1 offset.
 */
export function getWeekLabel(week: number): string {
  return `Week ${week + 1}`;
}
