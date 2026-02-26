import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { PageVisibilityContextValue } from '../../contexts/page-visibility-context';

vi.mock('../../contexts/page-visibility-context', async () => {
  const { createContext: createCtx } = await import('react');
  const ctx = createCtx<PageVisibilityContextValue | null>(null);
  return {
    PageVisibilityContext: ctx,
    __testContext: ctx,
  };
});

import { usePageVisibility } from '../../hooks/use-page-visibility';
import { PageVisibilityContext } from '../../contexts/page-visibility-context';

describe('usePageVisibility', () => {
  it('throws when used outside PageVisibilityProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => usePageVisibility())).toThrow(
      'usePageVisibility must be used within a PageVisibilityProvider'
    );

    consoleError.mockRestore();
  });

  it('returns context values when inside provider', () => {
    const mockContextValue: PageVisibilityContextValue = {
      allTimeEnabled: false,
      isLoading: false,
      pollLeadersEnabled: true,
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
});
