import { createContext, useMemo, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';

import { fetchPageVisibility } from '../services/api';
import { STALE_TIME_PAGE_VISIBILITY } from '../lib/query-config';

export interface PageVisibilityContextValue {
  allTimeEnabled: boolean;
  isLoading: boolean;
  pollLeadersEnabled: boolean;
  seasonTrendsEnabled: boolean;
}

export const PageVisibilityContext = createContext<PageVisibilityContextValue | null>(null);

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
    seasonTrendsEnabled: data?.seasonTrendsEnabled ?? true,
  }), [data, isLoading]);

  return (
    <PageVisibilityContext.Provider value={value}>
      {children}
    </PageVisibilityContext.Provider>
  );
}
