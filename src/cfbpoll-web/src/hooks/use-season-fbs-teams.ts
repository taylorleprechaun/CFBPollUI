import { useQuery } from '@tanstack/react-query';

import { fetchSeasonFbsTeams } from '../services/admin-api';

export function useSeasonFbsTeams(token: string | null, season: number | null) {
  return useQuery({
    queryKey: ['season-fbs-teams', season],
    queryFn: () => fetchSeasonFbsTeams(token!, season!),
    enabled: token !== null && season !== null,
  });
}
