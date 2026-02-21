import { useQuery } from '@tanstack/react-query';
import { fetchAllTimeRankings } from '../services/api';

export function useAllTime() {
  return useQuery({
    queryKey: ['all-time'],
    queryFn: fetchAllTimeRankings,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}
