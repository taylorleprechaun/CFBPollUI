import { useEffect, useState } from 'react';
import type { Week } from '../types';

export function useWeekSelection(weeks: Week[] | undefined): {
  selectedWeek: number | null;
  setSelectedWeek: (week: number | null) => void;
} {
  const [selectedWeek, setSelectedWeek] = useState<number | null>(() => {
    if (weeks?.length) {
      return weeks[weeks.length - 1].weekNumber;
    }
    return null;
  });

  useEffect(() => {
    if (weeks?.length && selectedWeek === null) {
      setSelectedWeek(weeks[weeks.length - 1].weekNumber);
    }
  }, [weeks, selectedWeek]);

  return { selectedWeek, setSelectedWeek };
}
