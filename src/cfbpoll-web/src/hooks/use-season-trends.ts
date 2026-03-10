import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { getStaleTime, STALE_TIME_SEASON_TRENDS } from '../lib/query-config';
import { fetchSeasonTrends } from '../services/api';

export function useSeasonTrends(season: number | null, maxSeason: number | null) {
  return useQuery({
    queryKey: ['season-trends', season],
    queryFn: () => fetchSeasonTrends(season!),
    enabled: season !== null,
    placeholderData: keepPreviousData,
    staleTime: getStaleTime(season, maxSeason, STALE_TIME_SEASON_TRENDS),
  });
}
