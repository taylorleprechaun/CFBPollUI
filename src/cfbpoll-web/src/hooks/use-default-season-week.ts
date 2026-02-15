import { useEffect, useState } from 'react';
import type { SeasonsResponse, WeeksResponse } from '../types';

interface UseDefaultSeasonWeekOptions {
  initialSeason?: number | null;
}

export function useDefaultSeasonWeek(
  seasonsData: SeasonsResponse | undefined,
  weeksData: WeeksResponse | undefined,
  options: UseDefaultSeasonWeekOptions = {}
) {
  const [season, setSeason] = useState<number | null>(options.initialSeason ?? null);
  const [week, setWeek] = useState<number | null>(null);

  useEffect(() => {
    if (seasonsData?.seasons?.length && season === null) {
      setSeason(seasonsData.seasons[0]);
    }
  }, [seasonsData, season]);

  useEffect(() => {
    if (weeksData?.weeks?.length && week === null) {
      const lastWeek = weeksData.weeks[weeksData.weeks.length - 1];
      setWeek(lastWeek.weekNumber);
    }
  }, [weeksData, week]);

  const resetWeek = () => setWeek(null);

  return { season, setSeason, week, setWeek, resetWeek };
}
