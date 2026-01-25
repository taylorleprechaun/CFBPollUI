import { useQuery } from '@tanstack/react-query';
import { fetchWeeks } from '../services/api';

export function useWeeks(season: number | null) {
  return useQuery({
    queryKey: ['weeks', season],
    queryFn: () => fetchWeeks(season!),
    enabled: season !== null,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
