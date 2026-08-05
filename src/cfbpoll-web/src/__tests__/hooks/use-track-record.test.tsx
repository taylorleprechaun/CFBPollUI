import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';
import { useTrackRecord } from '../../hooks/use-track-record';

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

describe('useTrackRecord', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('fetches track record data with the correct URL', async () => {
    const mockResponse = {
      overallOverUnder: { correct: 0, incorrect: 0, push: 0 },
      overallSpread: { correct: 0, incorrect: 0, push: 0 },
      overallWinner: { correct: 0, incorrect: 0, push: 0 },
      weeks: [],
    };

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const { result } = renderHook(() => useTrackRecord(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/track-record'),
      undefined
    );
  });

  it('returns error on fetch failure', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ message: 'Server error' }),
    } as Response);

    const { result } = renderHook(() => useTrackRecord(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });

  it('returns track record data on success', async () => {
    const mockResponse = {
      overallOverUnder: { correct: 12, incorrect: 8, push: 1 },
      overallSpread: { correct: 15, incorrect: 5, push: 0 },
      overallWinner: { correct: 18, incorrect: 2, push: 0 },
      weeks: [
        {
          overUnder: { correct: 3, incorrect: 2, push: 0 },
          season: 2024,
          spread: { correct: 4, incorrect: 1, push: 0 },
          week: 3,
          winner: { correct: 5, incorrect: 0, push: 0 },
        },
      ],
    };

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const { result } = renderHook(() => useTrackRecord(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.weeks).toHaveLength(1);
    expect(result.current.data?.overallWinner.correct).toBe(18);
  });
});
