import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PageVisibilityContext, type PageVisibilityContextValue, usePageVisibility } from '../../hooks/use-page-visibility';

describe('usePageVisibility', () => {
  it('returns context values when inside provider', () => {
    const mockContextValue: PageVisibilityContextValue = {
      allTimeEnabled: false,
      isLoading: false,
      pollLeadersEnabled: true,
      predictionsPageEnabled: true,
      seasonTrendsEnabled: true,
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PageVisibilityContext.Provider value={mockContextValue}>
        {children}
      </PageVisibilityContext.Provider>
    );

    const { result } = renderHook(() => usePageVisibility(), { wrapper });

    expect(result.current.allTimeEnabled).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.pollLeadersEnabled).toBe(true);
  });

  it('throws when used outside PageVisibilityProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => usePageVisibility())).toThrow(
      'usePageVisibility must be used within a PageVisibilityProvider'
    );

    consoleError.mockRestore();
  });
});
