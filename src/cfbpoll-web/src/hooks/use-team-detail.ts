import { useQuery } from '@tanstack/react-query';
import { GC_TIME_DEFAULT, getStaleTime, STALE_TIME_RANKINGS } from '../lib/query-config';
import { fetchTeamDetail } from '../services/api';

export function useTeamDetail(season: number | null, week: number | null, teamName: string | null, maxSeason: number | null = null) {
  return useQuery({
    queryKey: ['teamDetail', season, week, teamName],
    queryFn: () => fetchTeamDetail(season!, week!, teamName!),
    enabled: season !== null && week !== null && teamName !== null,
    gcTime: GC_TIME_DEFAULT,
    staleTime: getStaleTime(season, maxSeason, STALE_TIME_RANKINGS),
  });
}
