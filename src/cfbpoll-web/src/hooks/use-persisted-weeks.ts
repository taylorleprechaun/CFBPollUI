import { useQuery } from '@tanstack/react-query';
import { fetchPersistedWeeks } from '../services/admin-api';

export function usePersistedWeeks(token: string | null) {
  return useQuery({
    queryKey: ['persisted-weeks'],
    queryFn: () => fetchPersistedWeeks(token!),
    enabled: token !== null,
  });
}
