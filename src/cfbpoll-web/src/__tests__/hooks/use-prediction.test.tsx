import type { ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { usePrediction } from '../../hooks/use-prediction';

vi.mock('../../services/admin-api', () => ({
  fetchPrediction: vi.fn(),
}));

import { fetchPrediction } from '../../services/admin-api';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('usePrediction', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('does not fetch when token is null', () => {
    renderHook(() => usePrediction(null, 2024, 5), { wrapper: createWrapper() });

    expect(fetchPrediction).not.toHaveBeenCalled();
  });

  it('does not fetch when season is null', () => {
    renderHook(() => usePrediction('test-token', null, 5), { wrapper: createWrapper() });

    expect(fetchPrediction).not.toHaveBeenCalled();
  });

  it('does not fetch when week is null', () => {
    renderHook(() => usePrediction('test-token', 2024, null), { wrapper: createWrapper() });

    expect(fetchPrediction).not.toHaveBeenCalled();
  });

  it('fetches when token, season, and week are provided', async () => {
    const mockData = {
      isPublished: true,
      predictions: { isGraded: true, predictions: [], resultsPublished: false, season: 2024, week: 5 },
    };
    vi.mocked(fetchPrediction).mockResolvedValue(mockData);

    const { result } = renderHook(() => usePrediction('test-token', 2024, 5), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchPrediction).toHaveBeenCalledWith('test-token', 2024, 5);
    expect(result.current.data).toEqual(mockData);
  });

  it('returns error on fetch failure', async () => {
    vi.mocked(fetchPrediction).mockRejectedValue(new Error('Not found'));

    const { result } = renderHook(() => usePrediction('test-token', 2024, 5), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(Error);
  });
});
