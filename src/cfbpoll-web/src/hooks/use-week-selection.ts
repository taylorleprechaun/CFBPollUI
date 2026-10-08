import { useState } from 'react';

import type { Week } from '../types';

export type WeekDefaultStrategy = 'latest' | 'latest-complete';

export function useWeekSelection(weeks: Week[] | undefined, defaultStrategy: WeekDefaultStrategy = 'latest'): {
  selectedWeek: number | null;
  setSelectedWeek: (week: number | null) => void;
} {
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  const effectiveWeek = selectedWeek !== null ? selectedWeek : getDefaultWeek(weeks, defaultStrategy);

  return { selectedWeek: effectiveWeek, setSelectedWeek };
}

function getDefaultWeek(weeks: Week[] | undefined, defaultStrategy: WeekDefaultStrategy): number | null {
  if (!weeks?.length) return null;

  const weekNumbers = weeks.map((w) => w.weekNumber);

  if (defaultStrategy === 'latest') return Math.max(...weekNumbers);

  const completeWeekNumbers = weeks.filter((w) => w.isComplete).map((w) => w.weekNumber);

  // Before any week is complete (preseason), the first week is the one being worked on
  return completeWeekNumbers.length ? Math.max(...completeWeekNumbers) : Math.min(...weekNumbers);
}
