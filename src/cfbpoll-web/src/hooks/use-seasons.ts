import { useQuery } from '@tanstack/react-query';
import { fetchSeasons } from '../services/api';

export function useSeasons() {
  return useQuery({
    queryKey: ['seasons'],
    queryFn: fetchSeasons,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
