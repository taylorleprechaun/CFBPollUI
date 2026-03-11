export function groupBySeasonDescending<T extends { season: number; week: number }>(
  items: T[],
): { season: number; weeks: T[] }[] {
  const sorted = [...items].sort((a, b) => {
    if (a.season !== b.season) return b.season - a.season;
    return b.week - a.week;
  });

  const groups: { season: number; weeks: T[] }[] = [];
  for (const item of sorted) {
    const last = groups[groups.length - 1];
    if (last && last.season === item.season) {
      last.weeks.push(item);
    } else {
      groups.push({ season: item.season, weeks: [item] });
    }
  }
  return groups;
}
