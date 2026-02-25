import { useContext } from 'react';
import { PageVisibilityContext, type PageVisibilityContextValue } from '../contexts/page-visibility-context';

export function usePageVisibility(): PageVisibilityContextValue {
  const context = useContext(PageVisibilityContext);
  if (context === null) {
    throw new Error('usePageVisibility must be used within a PageVisibilityProvider');
  }
  return context;
}
