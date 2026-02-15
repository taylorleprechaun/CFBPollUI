import { useQuery } from '@tanstack/react-query';
import { fetchTeamDetail } from '../services/api';

export function useTeamDetail(season: number | null, week: number | null, teamName: string | null) {
  return useQuery({
    queryKey: ['teamDetail', season, week, teamName],
    queryFn: () => fetchTeamDetail(season!, week!, teamName!),
    enabled: season !== null && week !== null && teamName !== null,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
