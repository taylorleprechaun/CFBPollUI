import { createContext, useContext } from 'react';

export interface PageVisibilityContextValue {
  allTimeEnabled: boolean;
  isLoading: boolean;
  pollLeadersEnabled: boolean;
  predictionsPageEnabled: boolean;
  seasonTrendsEnabled: boolean;
}

export const PageVisibilityContext = createContext<PageVisibilityContextValue | null>(null);

export function usePageVisibility(): PageVisibilityContextValue {
  const context = useContext(PageVisibilityContext);
  if (context === null) {
    throw new Error('usePageVisibility must be used within a PageVisibilityProvider');
  }
  return context;
}
