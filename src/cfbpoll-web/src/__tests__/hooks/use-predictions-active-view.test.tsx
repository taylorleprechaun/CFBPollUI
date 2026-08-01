import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { usePredictionsActiveView } from '../../hooks/use-predictions-active-view';

vi.mock('../../services/admin-api', () => ({
  fetchPrediction: vi.fn(),
}));

import { fetchPrediction } from '../../services/admin-api';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

const predictions = { isGraded: false, predictions: [], resultsPublished: false, season: 2024, week: 5 };

describe('usePredictionsActiveView', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('view is null when no season/week is in the URL', () => {
    const { result } = renderHook(() => usePredictionsActiveView('test-token'), {
      wrapper: createWrapper(),
    });

    expect(result.current.view).toBeNull();
    expect(fetchPrediction).not.toHaveBeenCalled();
  });

  it('showView sets the active season/week and fetches the persisted week', async () => {
    vi.mocked(fetchPrediction).mockResolvedValue({ isPublished: true, predictions });

    const { result } = renderHook(() => usePredictionsActiveView('test-token'), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.showView(2024, 5);
    });

    await waitFor(() => expect(result.current.view).not.toBeNull());

    expect(fetchPrediction).toHaveBeenCalledWith('test-token', 2024, 5);
    expect(result.current.view?.source).toBe('viewed');
    expect(result.current.view?.isPublished).toBe(true);
    expect(result.current.view?.isPersisted).toBeNull();
  });

  it('applyCalculated primes the query cache and sets source to calculated without fetching', async () => {
    const { result } = renderHook(() => usePredictionsActiveView('test-token'), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.applyCalculated({ isPersisted: true, predictions });
    });

    await waitFor(() => expect(result.current.view).not.toBeNull());

    expect(result.current.view?.source).toBe('calculated');
    expect(result.current.view?.isPersisted).toBe(true);
    expect(result.current.view?.isPublished).toBeNull();
    expect(result.current.view?.unmatchedGameCount).toBeNull();
    expect(fetchPrediction).not.toHaveBeenCalled();
  });

  it('applyGraded primes the query cache and sets source to graded with unmatchedGameCount', async () => {
    const { result } = renderHook(() => usePredictionsActiveView('test-token'), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.applyGraded({ isPersisted: true, predictions, unmatchedGameCount: 3 });
    });

    await waitFor(() => expect(result.current.view).not.toBeNull());

    expect(result.current.view?.source).toBe('graded');
    expect(result.current.view?.unmatchedGameCount).toBe(3);
    expect(fetchPrediction).not.toHaveBeenCalled();
  });

  it('applyGraded preserves an existing published cache value instead of resetting it to false', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(['admin-prediction', 2024, 5], { isPublished: true, predictions });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    );

    const { result } = renderHook(() => usePredictionsActiveView('test-token'), { wrapper });

    act(() => {
      result.current.applyGraded({ isPersisted: true, predictions, unmatchedGameCount: 3 });
    });

    await waitFor(() => expect(result.current.view).not.toBeNull());

    expect(queryClient.getQueryData(['admin-prediction', 2024, 5])).toMatchObject({ isPublished: true });
  });

  it('applyGraded defaults to unpublished when no prior cache entry exists for the week', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    );

    const { result } = renderHook(() => usePredictionsActiveView('test-token'), { wrapper });

    act(() => {
      result.current.applyGraded({ isPersisted: true, predictions, unmatchedGameCount: 3 });
    });

    await waitFor(() => expect(result.current.view).not.toBeNull());

    expect(queryClient.getQueryData(['admin-prediction', 2024, 5])).toMatchObject({ isPublished: false });
  });

  it('clearIfMatches clears the active view when season and week match', async () => {
    const { result } = renderHook(() => usePredictionsActiveView('test-token'), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.applyCalculated({ isPersisted: true, predictions });
    });
    await waitFor(() => expect(result.current.view).not.toBeNull());

    act(() => {
      result.current.clearIfMatches(2024, 5);
    });

    await waitFor(() => expect(result.current.view).toBeNull());
  });

  it('clearIfMatches does not clear the active view for a non-matching week', async () => {
    const { result } = renderHook(() => usePredictionsActiveView('test-token'), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.applyCalculated({ isPersisted: true, predictions });
    });
    await waitFor(() => expect(result.current.view).not.toBeNull());

    act(() => {
      result.current.clearIfMatches(2024, 1);
    });

    expect(result.current.view).not.toBeNull();
  });
});
