import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';
import { useRankings } from '../../hooks/use-rankings';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
};

describe('useRankings', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('does not fetch when season is null', () => {
    renderHook(() => useRankings(null, 1), { wrapper: createWrapper() });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('does not fetch when week is null', () => {
    renderHook(() => useRankings(2024, null), { wrapper: createWrapper() });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('fetches when both season and week are provided', async () => {
    const mockResponse = {
      season: 2024,
      week: 5,
      rankings: [],
    };

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const { result } = renderHook(() => useRankings(2024, 5), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/rankings?season=2024&week=5'),
      undefined
    );
  });

  it('returns error on fetch failure', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ message: 'Server error' }),
    } as Response);

    const { result } = renderHook(() => useRankings(2024, 5), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });

  it('returns rankings data on success', async () => {
    const mockRankings = [
      {
        rank: 1,
        teamName: 'Georgia',
        logoURL: 'https://example.com/logo.png',
        conference: 'SEC',
        division: 'East',
        wins: 5,
        losses: 0,
        record: '5-0',
        rating: 85.5,
        weightedSOS: 0.65,
        sosRanking: 5,
      },
    ];

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          season: 2024,
          week: 5,
          rankings: mockRankings,
        }),
    } as Response);

    const { result } = renderHook(() => useRankings(2024, 5), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.rankings).toHaveLength(1);
    expect(result.current.data?.rankings[0].teamName).toBe('Georgia');
  });
});
