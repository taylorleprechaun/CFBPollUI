import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { deleteCacheEntries, deleteCacheEntry, fetchCacheEntries } from '../services/admin-api';

const CACHE_ENTRIES_QUERY_KEY = ['cache-entries'];

export function useCacheEntries(token: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: CACHE_ENTRIES_QUERY_KEY,
    queryFn: () => fetchCacheEntries(token!),
    enabled: token !== null,
  });

  const deleteOneMutation = useMutation({
    mutationFn: (cacheKey: string) => {
      if (!token) throw new Error('Authentication required');
      return deleteCacheEntry(token, cacheKey);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_ENTRIES_QUERY_KEY });
    },
  });

  const deleteManyMutation = useMutation({
    mutationFn: (cacheKeys: string[]) => {
      if (!token) throw new Error('Authentication required');
      return deleteCacheEntries(token, cacheKeys);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_ENTRIES_QUERY_KEY });
    },
  });

  return {
    ...query,
    deleteMany: deleteManyMutation.mutateAsync,
    deleteOne: deleteOneMutation.mutateAsync,
    isDeleting: deleteOneMutation.isPending || deleteManyMutation.isPending,
  };
}
