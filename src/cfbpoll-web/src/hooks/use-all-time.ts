import { useQuery } from '@tanstack/react-query';
import { STALE_TIME_ALL_TIME } from '../lib/query-config';
import { fetchAllTimeRankings } from '../services/api';

export function useAllTime() {
  return useQuery({
    queryKey: ['all-time'],
    queryFn: fetchAllTimeRankings,
    staleTime: STALE_TIME_ALL_TIME,
  });
}
