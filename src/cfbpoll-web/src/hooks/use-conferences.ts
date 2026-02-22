import { useQuery } from '@tanstack/react-query';
import { STALE_TIME_CONFERENCES } from '../lib/query-config';
import { fetchConferences } from '../services/api';

export function useConferences() {
  return useQuery({
    queryKey: ['conferences'],
    queryFn: fetchConferences,
    staleTime: STALE_TIME_CONFERENCES,
  });
}
