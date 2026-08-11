import { useQuery } from '@tanstack/react-query';

import { STALE_TIME_TEAM_PREDICTION_RECORDS } from '../lib/query-config';
import { fetchTeamPredictionRecords } from '../services/api';

export function useTeamPredictionRecords(season: number | null) {
  return useQuery({
    queryKey: ['team-prediction-records', season],
    queryFn: () => fetchTeamPredictionRecords(season!),
    enabled: season !== null,
    staleTime: STALE_TIME_TEAM_PREDICTION_RECORDS,
  });
}
