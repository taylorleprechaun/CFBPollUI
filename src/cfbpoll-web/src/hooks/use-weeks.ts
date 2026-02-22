import { useQuery } from '@tanstack/react-query';
import { STALE_TIME_SEASONS } from '../lib/query-config';
import { fetchWeeks } from '../services/api';

export function useWeeks(season: number | null) {
  return useQuery({
    queryKey: ['weeks', season],
    queryFn: () => fetchWeeks(season!),
    enabled: season !== null,
    staleTime: STALE_TIME_SEASONS,
  });
}
