import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';
import { useTeamDetail } from '../../hooks/use-team-detail';

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

describe('useTeamDetail', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('does not fetch when season is null', () => {
    renderHook(() => useTeamDetail(null, 5, 'Oregon'), { wrapper: createWrapper() });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('does not fetch when week is null', () => {
    renderHook(() => useTeamDetail(2024, null, 'Oregon'), { wrapper: createWrapper() });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('does not fetch when teamName is null', () => {
    renderHook(() => useTeamDetail(2024, 5, null), { wrapper: createWrapper() });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('fetches when all params are provided', async () => {
    const mockResponse = {
      altColor: '#FFD700',
      color: '#006400',
      conference: 'Big Ten',
      details: {
        home: { wins: 6, losses: 0 },
        away: { wins: 4, losses: 0 },
        neutral: { wins: 1, losses: 0 },
        vsRank1To10: { wins: 2, losses: 0 },
        vsRank11To25: { wins: 3, losses: 0 },
        vsRank26To50: { wins: 1, losses: 0 },
        vsRank51To100: { wins: 2, losses: 0 },
        vsRank101Plus: { wins: 3, losses: 0 },
      },
      division: '',
      logoURL: 'https://example.com/oregon.png',
      rank: 1,
      rating: 165.42,
      record: '11-0',
      schedule: [],
      sosRanking: 15,
      teamName: 'Oregon',
      weightedSOS: 0.582,
    };

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const { result } = renderHook(() => useTeamDetail(2024, 5, 'Oregon'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(global.fetch).toHaveBeenCalled();
  });

  it('constructs correct URL with encoded team name', async () => {
    const mockResponse = {
      altColor: '#FFD700',
      color: '#006400',
      conference: 'Big Ten',
      details: {
        home: { wins: 6, losses: 0 },
        away: { wins: 4, losses: 0 },
        neutral: { wins: 1, losses: 0 },
        vsRank1To10: { wins: 2, losses: 0 },
        vsRank11To25: { wins: 3, losses: 0 },
        vsRank26To50: { wins: 1, losses: 0 },
        vsRank51To100: { wins: 2, losses: 0 },
        vsRank101Plus: { wins: 3, losses: 0 },
      },
      division: '',
      logoURL: 'https://example.com/oregon.png',
      rank: 1,
      rating: 165.42,
      record: '11-0',
      schedule: [],
      sosRanking: 15,
      teamName: 'Oregon',
      weightedSOS: 0.582,
    };

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const { result } = renderHook(() => useTeamDetail(2024, 5, 'Oregon'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/teams/Oregon?season=2024&week=5'),
      undefined
    );
  });

  it('returns error on fetch failure', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ message: 'Server error' }),
    } as Response);

    const { result } = renderHook(() => useTeamDetail(2024, 5, 'Oregon'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });

  it('returns team detail data on success', async () => {
    const mockResponse = {
      altColor: '#FFD700',
      color: '#006400',
      conference: 'Big Ten',
      details: {
        home: { wins: 6, losses: 0 },
        away: { wins: 4, losses: 0 },
        neutral: { wins: 1, losses: 0 },
        vsRank1To10: { wins: 2, losses: 0 },
        vsRank11To25: { wins: 3, losses: 0 },
        vsRank26To50: { wins: 1, losses: 0 },
        vsRank51To100: { wins: 2, losses: 0 },
        vsRank101Plus: { wins: 3, losses: 0 },
      },
      division: '',
      logoURL: 'https://example.com/oregon.png',
      rank: 1,
      rating: 165.42,
      record: '11-0',
      schedule: [],
      sosRanking: 15,
      teamName: 'Oregon',
      weightedSOS: 0.582,
    };

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const { result } = renderHook(() => useTeamDetail(2024, 5, 'Oregon'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.teamName).toBe('Oregon');
    expect(result.current.data?.rank).toBe(1);
    expect(result.current.data?.rating).toBe(165.42);
    expect(result.current.data?.conference).toBe('Big Ten');
  });
});
