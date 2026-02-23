import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { STALE_TIME_POLL_LEADERS } from '../lib/query-config';
import { fetchPollLeaders } from '../services/api';

export function usePollLeaders(minSeason?: number, maxSeason?: number) {
  return useQuery({
    queryKey: ['poll-leaders', minSeason, maxSeason],
    queryFn: () => fetchPollLeaders(minSeason, maxSeason),
    enabled: (minSeason === undefined && maxSeason === undefined)
      || (minSeason !== undefined && maxSeason !== undefined),
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME_POLL_LEADERS,
  });
}
