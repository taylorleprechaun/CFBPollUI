import { useQuery } from '@tanstack/react-query';
import { fetchAvailableWeeks } from '../services/api';

export function useAvailableWeeks(season: number | null) {
  return useQuery({
    queryKey: ['available-weeks', season],
    queryFn: () => fetchAvailableWeeks(season!),
    enabled: season !== null,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
