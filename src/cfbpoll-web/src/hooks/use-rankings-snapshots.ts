import { useQuery } from '@tanstack/react-query';

import { STALE_TIME_RANKINGS_SNAPSHOTS } from '../lib/query-config';
import { fetchRankingsSnapshots } from '../services/admin-api';

export function useRankingsSnapshots(token: string | null) {
  return useQuery({
    queryKey: ['rankings-snapshots'],
    queryFn: () => fetchRankingsSnapshots(token!),
    enabled: token !== null,
    staleTime: STALE_TIME_RANKINGS_SNAPSHOTS,
  });
}
