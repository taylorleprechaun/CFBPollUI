import { useEffect } from 'react';

import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';

import { STALE_TIME_POLL_LEADERS } from '../lib/query-config';
import { fetchPollLeaders } from '../services/api';

export function usePollLeaders(minSeason?: number, maxSeason?: number) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['poll-leaders', minSeason, maxSeason],
    queryFn: () => fetchPollLeaders(minSeason, maxSeason),
    enabled: (minSeason === undefined && maxSeason === undefined)
      || (minSeason !== undefined && maxSeason !== undefined),
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME_POLL_LEADERS,
  });

  useEffect(() => {
    if (minSeason === undefined && maxSeason === undefined && query.data) {
      queryClient.setQueryData(
        ['poll-leaders', query.data.minAvailableSeason, query.data.maxAvailableSeason],
        query.data
      );
    }
  }, [minSeason, maxSeason, query.data, queryClient]);

  return query;
}
