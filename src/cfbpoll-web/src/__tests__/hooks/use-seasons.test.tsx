import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';
import { useSeasons } from '../../hooks/use-seasons';

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

describe('useSeasons', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('fetches seasons on mount', async () => {
    const mockResponse = { seasons: [2024, 2023, 2022] };

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const { result } = renderHook(() => useSeasons(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/seasons'),
      undefined
    );
    expect(result.current.data?.seasons).toEqual([2024, 2023, 2022]);
  });

  it('returns loading state initially', () => {
    vi.mocked(global.fetch).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { result } = renderHook(() => useSeasons(), {
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

    const { result } = renderHook(() => useSeasons(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });

  it('returns empty array when seasons is empty', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ seasons: [] }),
    } as Response);

    const { result } = renderHook(() => useSeasons(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.seasons).toEqual([]);
  });
});
