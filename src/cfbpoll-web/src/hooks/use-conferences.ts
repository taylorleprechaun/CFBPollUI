import { useQuery } from '@tanstack/react-query';
import { fetchConferences } from '../services/api';

export function useConferences() {
  return useQuery({
    queryKey: ['conferences'],
    queryFn: fetchConferences,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}
