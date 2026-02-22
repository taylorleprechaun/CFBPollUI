import { useState } from 'react';

import type { Week } from '../types';

export function useWeekSelection(weeks: Week[] | undefined): {
  selectedWeek: number | null;
  setSelectedWeek: (week: number | null) => void;
} {
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  const effectiveWeek = selectedWeek !== null
    ? selectedWeek
    : weeks?.length ? weeks[weeks.length - 1].weekNumber : null;

  return { selectedWeek: effectiveWeek, setSelectedWeek };
}
