import { useQuery } from '@tanstack/react-query';
import { type ReactNode, useMemo } from 'react';

import { PageVisibilityContext, type PageVisibilityContextValue } from '../hooks/use-page-visibility';
import { STALE_TIME_PAGE_VISIBILITY } from '../lib/query-config';
import { fetchPageVisibility } from '../services/api';

export function PageVisibilityProvider({ children }: { children: ReactNode }) {
  const { data, isLoading } = useQuery({
    queryKey: ['page-visibility'],
    queryFn: fetchPageVisibility,
    staleTime: STALE_TIME_PAGE_VISIBILITY,
  });

  const value = useMemo<PageVisibilityContextValue>(() => ({
    allTimeEnabled: data?.allTimeEnabled ?? true,
    isLoading,
    pollLeadersEnabled: data?.pollLeadersEnabled ?? true,
    predictionsPageEnabled: data?.predictionsPageEnabled ?? true,
    seasonTrendsEnabled: data?.seasonTrendsEnabled ?? true,
  }), [data, isLoading]);

  return (
    <PageVisibilityContext.Provider value={value}>
      {children}
    </PageVisibilityContext.Provider>
  );
}
