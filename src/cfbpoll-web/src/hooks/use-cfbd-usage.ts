import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { STALE_TIME_CFBD_USAGE } from '../lib/query-config';
import { fetchCfbdUsage } from '../services/admin-api';

const CFBD_USAGE_QUERY_KEY = ['cfbd-usage'];

export function useCfbdUsage(token: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: CFBD_USAGE_QUERY_KEY,
    queryFn: () => fetchCfbdUsage(token!, false),
    enabled: token !== null,
    staleTime: STALE_TIME_CFBD_USAGE,
  });

  const refreshMutation = useMutation({
    mutationFn: () => {
      if (!token) throw new Error('Authentication required');
      return fetchCfbdUsage(token, true);
    },
    onSuccess: (result) => {
      queryClient.setQueryData(CFBD_USAGE_QUERY_KEY, result);
    },
  });

  return {
    ...query,
    isRefreshing: refreshMutation.isPending,
    refresh: () => refreshMutation.mutate(),
  };
}
