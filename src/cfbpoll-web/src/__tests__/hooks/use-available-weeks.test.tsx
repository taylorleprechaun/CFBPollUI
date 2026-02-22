import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';
import { useAvailableWeeks } from '../../hooks/use-available-weeks';

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

describe('useAvailableWeeks', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('fetches available weeks for a season', async () => {
    const mockResponse = {
      season: 2024,
      weeks: [
        { weekNumber: 1, label: 'Week 1' },
        { weekNumber: 2, label: 'Week 2' },
      ],
    };

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const { result } = renderHook(() => useAvailableWeeks(2024), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/rankings/available-weeks?season=2024'),
      undefined
    );
    expect(result.current.data?.weeks).toHaveLength(2);
  });

  it('does not fetch when season is null', () => {
    vi.mocked(global.fetch).mockImplementation(
      () => new Promise(() => {})
    );

    const { result } = renderHook(() => useAvailableWeeks(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe('idle');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns loading state while fetching', () => {
    vi.mocked(global.fetch).mockImplementation(
      () => new Promise(() => {})
    );

    const { result } = renderHook(() => useAvailableWeeks(2024), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('returns error on fetch failure', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ message: 'Server error' }),
    } as Response);

    const { result } = renderHook(() => useAvailableWeeks(2024), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });

  it('refetch after error succeeds', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ message: 'Server error' }),
    } as Response);

    const { result } = renderHook(() => useAvailableWeeks(2024), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          season: 2024,
          weeks: [{ weekNumber: 1, label: 'Week 1' }],
        }),
    } as Response);

    await result.current.refetch();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.weeks).toHaveLength(1);
  });

  it('changing season triggers new fetch', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          season: 2024,
          weeks: [{ weekNumber: 1, label: 'Week 1' }],
        }),
    } as Response);

    const { result, rerender } = renderHook(
      ({ season }: { season: number }) => useAvailableWeeks(season),
      {
        wrapper: createWrapper(),
        initialProps: { season: 2024 },
      }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          season: 2023,
          weeks: [{ weekNumber: 1, label: 'Week 1' }],
        }),
    } as Response);

    rerender({ season: 2023 });

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('season=2023'),
        undefined
      )
    );
  });

  it('transitioning season from null to valid triggers fetch', async () => {
    const { result, rerender } = renderHook(
      ({ season }: { season: number | null }) => useAvailableWeeks(season),
      {
        wrapper: createWrapper(),
        initialProps: { season: null as number | null },
      }
    );

    expect(global.fetch).not.toHaveBeenCalled();

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          season: 2024,
          weeks: [{ weekNumber: 1, label: 'Week 1' }],
        }),
    } as Response);

    rerender({ season: 2024 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(global.fetch).toHaveBeenCalled();
  });
});
