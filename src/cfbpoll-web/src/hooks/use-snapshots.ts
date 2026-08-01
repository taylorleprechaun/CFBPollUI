import { useQuery } from '@tanstack/react-query';

import { STALE_TIME_SNAPSHOTS } from '../lib/query-config';
import { fetchSnapshots } from '../services/admin-api';

export function useSnapshots(token: string | null) {
  return useQuery({
    queryKey: ['snapshots'],
    queryFn: () => fetchSnapshots(token!),
    enabled: token !== null,
    staleTime: STALE_TIME_SNAPSHOTS,
  });
}
