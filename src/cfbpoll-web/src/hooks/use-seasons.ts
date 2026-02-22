import { useQuery } from '@tanstack/react-query';
import { STALE_TIME_SEASONS } from '../lib/query-config';
import { fetchSeasons } from '../services/api';

export function useSeasons() {
  return useQuery({
    queryKey: ['seasons'],
    queryFn: fetchSeasons,
    staleTime: STALE_TIME_SEASONS,
  });
}
