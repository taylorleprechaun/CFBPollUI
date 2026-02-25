import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';
import { usePollLeaders } from '../../hooks/use-poll-leaders';

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

describe('usePollLeaders', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('fetches poll leaders data with correct URL', async () => {
    const mockResponse = {
      allWeeks: [],
      finalWeeksOnly: [],
      minAvailableSeason: 2002,
      maxAvailableSeason: 2024,
    };

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => usePollLeaders(2002, 2024), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/poll-leaders'),
      undefined
    );
  });

  it('passes season params to API function', async () => {
    const mockResponse = {
      allWeeks: [],
      finalWeeksOnly: [],
      minAvailableSeason: 2010,
      maxAvailableSeason: 2020,
    };

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => usePollLeaders(2010, 2020), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const fetchUrl = vi.mocked(global.fetch).mock.calls[0][0] as string;
    expect(fetchUrl).toContain('minSeason=2010');
    expect(fetchUrl).toContain('maxSeason=2020');
  });

  it('fetches when both params are undefined for initial load', async () => {
    const mockResponse = {
      allWeeks: [],
      finalWeeksOnly: [],
      minAvailableSeason: 2002,
      maxAvailableSeason: 2024,
    };

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => usePollLeaders(undefined, undefined), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(global.fetch).toHaveBeenCalled();
  });

  it('does not fetch when only one param is provided', () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => usePollLeaders(2002, undefined), {
      wrapper: Wrapper,
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns error on fetch failure', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ message: 'Server error' }),
    } as Response);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => usePollLeaders(2002, 2024), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });

  it('returns poll leaders data on success', async () => {
    const mockResponse = {
      allWeeks: [
        { logoURL: 'https://example.com/ohio-state.png', teamName: 'Ohio State', top5Count: 5, top10Count: 8, top25Count: 15 },
      ],
      finalWeeksOnly: [],
      minAvailableSeason: 2002,
      maxAvailableSeason: 2024,
    };

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => usePollLeaders(2002, 2024), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.allWeeks).toHaveLength(1);
    expect(result.current.data?.allWeeks[0].teamName).toBe('Ohio State');
  });

  it('seeds query cache for specific season range after parameterless fetch', async () => {
    const mockResponse = {
      allWeeks: [],
      finalWeeksOnly: [],
      minAvailableSeason: 2002,
      maxAvailableSeason: 2024,
    };

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const { Wrapper, queryClient } = createWrapper();
    const { result } = renderHook(() => usePollLeaders(undefined, undefined), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const seededData = queryClient.getQueryData(['poll-leaders', 2002, 2024]);
    expect(seededData).toEqual(mockResponse);
  });
});
