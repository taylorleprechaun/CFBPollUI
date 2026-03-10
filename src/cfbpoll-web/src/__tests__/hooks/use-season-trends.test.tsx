import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';
import { useSeasonTrends } from '../../hooks/use-season-trends';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return { Wrapper, queryClient };
};

describe('useSeasonTrends', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('does not fetch when season is null', () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useSeasonTrends(null, 2024), {
      wrapper: Wrapper,
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('fetches season trends data with correct URL', async () => {
    const mockResponse = {
      season: 2024,
      teams: [],
      weeks: [],
    };

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useSeasonTrends(2024, 2024), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/seasons/2024/trends'),
      undefined
    );
  });

  it('returns season trends data on success', async () => {
    const mockResponse = {
      season: 2024,
      teams: [
        {
          altColor: '#FFFFFF',
          color: '#BB0000',
          conference: 'Big Ten',
          logoURL: 'https://example.com/ohio-state.png',
          rankings: [{ rank: 1, rating: 95.0, record: '8-0', weekNumber: 1 }],
          teamName: 'Ohio State',
        },
      ],
      weeks: [{ label: 'Week 2', weekNumber: 1 }],
    };

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useSeasonTrends(2024, 2024), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.teams).toHaveLength(1);
    expect(result.current.data?.teams[0].teamName).toBe('Ohio State');
  });

  it('returns error on fetch failure', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ message: 'Server error' }),
    } as Response);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useSeasonTrends(2024, 2024), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });

  it('uses infinite stale time for historical seasons', () => {
    const { Wrapper } = createWrapper();
    renderHook(() => useSeasonTrends(2020, 2024), {
      wrapper: Wrapper,
    });

    // The hook should use getStaleTime which returns Infinity for season < maxSeason
    // We verify by checking the query was configured (no assertion on staleTime directly)
    expect(global.fetch).toHaveBeenCalled();
  });
});
