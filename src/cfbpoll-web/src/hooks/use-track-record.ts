import { useQuery } from '@tanstack/react-query';

import { STALE_TIME_TRACK_RECORD } from '../lib/query-config';
import { fetchTrackRecord } from '../services/api';

export function useTrackRecord() {
  return useQuery({
    queryKey: ['track-record'],
    queryFn: fetchTrackRecord,
    staleTime: STALE_TIME_TRACK_RECORD,
  });
}
