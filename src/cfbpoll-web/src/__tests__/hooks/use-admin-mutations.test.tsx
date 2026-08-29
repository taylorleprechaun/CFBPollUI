import type { ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  useCalculatePredictions,
  useCalculateRankings,
  useDeletePredictions,
  useDeleteRankingsSnapshot,
  useExportRankingsSnapshot,
  useGradePredictions,
  usePublishGradedResults,
  usePublishPredictions,
  usePublishRankingsSnapshot,
  useRefreshCache,
} from '../../hooks/use-admin-mutations';

vi.mock('../../services/admin-api', () => ({
  calculatePredictions: vi.fn(),
  calculateRankings: vi.fn(),
  deletePredictions: vi.fn(),
  deleteRankingsSnapshot: vi.fn(),
  downloadExport: vi.fn(),
  gradePredictions: vi.fn(),
  publishGradedResults: vi.fn(),
  publishPredictions: vi.fn(),
  publishRankingsSnapshot: vi.fn(),
  refreshCache: vi.fn(),
}));

import {
  calculatePredictions,
  calculateRankings,
  deletePredictions,
  deleteRankingsSnapshot,
  downloadExport,
  gradePredictions,
  publishGradedResults,
  publishPredictions,
  publishRankingsSnapshot,
  refreshCache,
} from '../../services/admin-api';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('null token guard', () => {
  beforeEach(() => vi.resetAllMocks());

  it('useCalculatePredictions rejects with Authentication required when token is null', async () => {
    const { result } = renderHook(() => useCalculatePredictions(null), {
      wrapper: createWrapper(),
    });

    await expect(
      act(() => result.current.mutateAsync({ season: 2024, week: 3 }))
    ).rejects.toThrow('Authentication required');

    expect(calculatePredictions).not.toHaveBeenCalled();
  });

  it('useCalculateRankings rejects with Authentication required when token is null', async () => {
    const { result } = renderHook(() => useCalculateRankings(null), {
      wrapper: createWrapper(),
    });

    await expect(
      act(() => result.current.mutateAsync({ season: 2024, week: 5 }))
    ).rejects.toThrow('Authentication required');

    expect(calculateRankings).not.toHaveBeenCalled();
  });

  it('useDeletePredictions rejects with Authentication required when token is null', async () => {
    const { result } = renderHook(() => useDeletePredictions(null), {
      wrapper: createWrapper(),
    });

    await expect(
      act(() => result.current.mutateAsync({ season: 2024, week: 3 }))
    ).rejects.toThrow('Authentication required');

    expect(deletePredictions).not.toHaveBeenCalled();
  });

  it('useDeleteRankingsSnapshot rejects with Authentication required when token is null', async () => {
    const { result } = renderHook(() => useDeleteRankingsSnapshot(null), {
      wrapper: createWrapper(),
    });

    await expect(
      act(() => result.current.mutateAsync({ season: 2024, week: 5 }))
    ).rejects.toThrow('Authentication required');

    expect(deleteRankingsSnapshot).not.toHaveBeenCalled();
  });

  it('useExportRankingsSnapshot rejects with Authentication required when token is null', async () => {
    const { result } = renderHook(() => useExportRankingsSnapshot(null), {
      wrapper: createWrapper(),
    });

    await expect(
      act(() => result.current.mutateAsync({ season: 2024, week: 5 }))
    ).rejects.toThrow('Authentication required');

    expect(downloadExport).not.toHaveBeenCalled();
  });

  it('useGradePredictions rejects with Authentication required when token is null', async () => {
    const { result } = renderHook(() => useGradePredictions(null), {
      wrapper: createWrapper(),
    });

    await expect(
      act(() => result.current.mutateAsync({ season: 2024, week: 3 }))
    ).rejects.toThrow('Authentication required');

    expect(gradePredictions).not.toHaveBeenCalled();
  });

  it('usePublishGradedResults rejects with Authentication required when token is null', async () => {
    const { result } = renderHook(() => usePublishGradedResults(null), {
      wrapper: createWrapper(),
    });

    await expect(
      act(() => result.current.mutateAsync({ season: 2024, week: 3 }))
    ).rejects.toThrow('Authentication required');

    expect(publishGradedResults).not.toHaveBeenCalled();
  });

  it('usePublishPredictions rejects with Authentication required when token is null', async () => {
    const { result } = renderHook(() => usePublishPredictions(null), {
      wrapper: createWrapper(),
    });

    await expect(
      act(() => result.current.mutateAsync({ season: 2024, week: 3 }))
    ).rejects.toThrow('Authentication required');

    expect(publishPredictions).not.toHaveBeenCalled();
  });

  it('usePublishRankingsSnapshot rejects with Authentication required when token is null', async () => {
    const { result } = renderHook(() => usePublishRankingsSnapshot(null), {
      wrapper: createWrapper(),
    });

    await expect(
      act(() => result.current.mutateAsync({ season: 2024, week: 5 }))
    ).rejects.toThrow('Authentication required');

    expect(publishRankingsSnapshot).not.toHaveBeenCalled();
  });

  it('useRefreshCache rejects with Authentication required when token is null', async () => {
    const { result } = renderHook(() => useRefreshCache(null), {
      wrapper: createWrapper(),
    });

    await expect(
      act(() => result.current.mutateAsync({ season: 2024, week: 5 }))
    ).rejects.toThrow('Authentication required');

    expect(refreshCache).not.toHaveBeenCalled();
  });
});

describe('useCalculatePredictions', () => {
  beforeEach(() => vi.resetAllMocks());

  it('calls calculatePredictions with token and params', async () => {
    const mockResult = { isPersisted: true, predictions: { isGraded: false, resultsPublished: false, season: 2024, week: 3, predictions: [] } };
    vi.mocked(calculatePredictions).mockResolvedValue(mockResult);

    const { result } = renderHook(() => useCalculatePredictions('test-token'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ season: 2024, week: 3 });
    });

    expect(calculatePredictions).toHaveBeenCalledWith('test-token', 2024, 3);
  });

  it('rejects on failure', async () => {
    vi.mocked(calculatePredictions).mockRejectedValue(new Error('Failed'));

    const { result } = renderHook(() => useCalculatePredictions('test-token'), {
      wrapper: createWrapper(),
    });

    await expect(
      act(() => result.current.mutateAsync({ season: 2024, week: 3 }))
    ).rejects.toThrow('Failed');
  });
});

describe('useCalculateRankings', () => {
  beforeEach(() => vi.resetAllMocks());

  it('calls calculateRankings with token and params', async () => {
    const mockResult = { isPersisted: true, rankings: { season: 2024, week: 5, rankings: [] } };
    vi.mocked(calculateRankings).mockResolvedValue(mockResult);

    const { result } = renderHook(() => useCalculateRankings('test-token'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ season: 2024, week: 5 });
    });

    expect(calculateRankings).toHaveBeenCalledWith('test-token', 2024, 5);
  });

  it('rejects on failure', async () => {
    vi.mocked(calculateRankings).mockRejectedValue(new Error('Failed'));

    const { result } = renderHook(() => useCalculateRankings('test-token'), {
      wrapper: createWrapper(),
    });

    await expect(
      act(() => result.current.mutateAsync({ season: 2024, week: 5 }))
    ).rejects.toThrow('Failed');
  });
});

describe('useDeletePredictions', () => {
  beforeEach(() => vi.resetAllMocks());

  it('calls deletePredictions with token and params', async () => {
    vi.mocked(deletePredictions).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeletePredictions('test-token'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ season: 2024, week: 3 });
    });

    expect(deletePredictions).toHaveBeenCalledWith('test-token', 2024, 3);
  });

  it('does not remove admin-prediction cache entries for other weeks', async () => {
    vi.mocked(deletePredictions).mockResolvedValue(undefined);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(['admin-prediction', 2024, 5], {
      isPublished: true,
      predictions: { isGraded: false, predictions: [], resultsPublished: false, season: 2024, week: 5 },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useDeletePredictions('test-token'), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ season: 2024, week: 3 });
    });

    expect(queryClient.getQueryData(['admin-prediction', 2024, 5])).toBeDefined();
  });

  it('removes the admin-prediction cache entry for the deleted week on success', async () => {
    vi.mocked(deletePredictions).mockResolvedValue(undefined);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(['admin-prediction', 2024, 3], {
      isPublished: true,
      predictions: { isGraded: false, predictions: [], resultsPublished: false, season: 2024, week: 3 },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useDeletePredictions('test-token'), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ season: 2024, week: 3 });
    });

    expect(queryClient.getQueryData(['admin-prediction', 2024, 3])).toBeUndefined();
  });
});

describe('useDeleteRankingsSnapshot', () => {
  beforeEach(() => vi.resetAllMocks());

  it('calls deleteRankingsSnapshot with token and params', async () => {
    vi.mocked(deleteRankingsSnapshot).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteRankingsSnapshot('test-token'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ season: 2024, week: 5 });
    });

    expect(deleteRankingsSnapshot).toHaveBeenCalledWith('test-token', 2024, 5);
  });
});

describe('useExportRankingsSnapshot', () => {
  beforeEach(() => vi.resetAllMocks());

  it('calls downloadExport with token and params', async () => {
    vi.mocked(downloadExport).mockResolvedValue(undefined);

    const { result } = renderHook(() => useExportRankingsSnapshot('test-token'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ season: 2024, week: 5 });
    });

    expect(downloadExport).toHaveBeenCalledWith('test-token', 2024, 5);
  });
});

describe('useGradePredictions', () => {
  beforeEach(() => vi.resetAllMocks());

  it('calls gradePredictions with token and params', async () => {
    const mockResult = {
      isPersisted: true,
      predictions: { isGraded: true, resultsPublished: true, season: 2024, week: 3, predictions: [] },
      unmatchedGameCount: 0,
    };
    vi.mocked(gradePredictions).mockResolvedValue(mockResult);

    const { result } = renderHook(() => useGradePredictions('test-token'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ season: 2024, week: 3 });
    });

    expect(gradePredictions).toHaveBeenCalledWith('test-token', 2024, 3);
  });

  it('rejects on failure', async () => {
    vi.mocked(gradePredictions).mockRejectedValue(new Error('Failed'));

    const { result } = renderHook(() => useGradePredictions('test-token'), {
      wrapper: createWrapper(),
    });

    await expect(
      act(() => result.current.mutateAsync({ season: 2024, week: 3 }))
    ).rejects.toThrow('Failed');
  });
});

describe('usePublishGradedResults', () => {
  beforeEach(() => vi.resetAllMocks());

  it('calls publishGradedResults with token and params', async () => {
    vi.mocked(publishGradedResults).mockResolvedValue(undefined);

    const { result } = renderHook(() => usePublishGradedResults('test-token'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ season: 2024, week: 3 });
    });

    expect(publishGradedResults).toHaveBeenCalledWith('test-token', 2024, 3);
  });

  it('does not create an admin-prediction cache entry when none existed', async () => {
    vi.mocked(publishGradedResults).mockResolvedValue(undefined);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => usePublishGradedResults('test-token'), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ season: 2024, week: 3 });
    });

    expect(queryClient.getQueryData(['admin-prediction', 2024, 3])).toBeUndefined();
  });

  it('marks the admin-prediction cache entry as having published results on success', async () => {
    vi.mocked(publishGradedResults).mockResolvedValue(undefined);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(['admin-prediction', 2024, 3], {
      isPublished: true,
      predictions: { isGraded: true, predictions: [], resultsPublished: false, season: 2024, week: 3 },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => usePublishGradedResults('test-token'), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ season: 2024, week: 3 });
    });

    expect(queryClient.getQueryData(['admin-prediction', 2024, 3])).toMatchObject({
      isPublished: true,
      predictions: { resultsPublished: true },
    });
  });
});

describe('usePublishPredictions', () => {
  beforeEach(() => vi.resetAllMocks());

  it('calls publishPredictions with token and params', async () => {
    vi.mocked(publishPredictions).mockResolvedValue(undefined);

    const { result } = renderHook(() => usePublishPredictions('test-token'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ season: 2024, week: 3 });
    });

    expect(publishPredictions).toHaveBeenCalledWith('test-token', 2024, 3);
  });

  it('does not create an admin-prediction cache entry when none existed', async () => {
    vi.mocked(publishPredictions).mockResolvedValue(undefined);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => usePublishPredictions('test-token'), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ season: 2024, week: 3 });
    });

    expect(queryClient.getQueryData(['admin-prediction', 2024, 3])).toBeUndefined();
  });

  it('marks the admin-prediction cache entry as published on success', async () => {
    vi.mocked(publishPredictions).mockResolvedValue(undefined);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(['admin-prediction', 2024, 3], {
      isPublished: false,
      predictions: { isGraded: false, predictions: [], resultsPublished: false, season: 2024, week: 3 },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => usePublishPredictions('test-token'), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ season: 2024, week: 3 });
    });

    expect(queryClient.getQueryData(['admin-prediction', 2024, 3])).toMatchObject({ isPublished: true });
  });
});

describe('usePublishRankingsSnapshot', () => {
  beforeEach(() => vi.resetAllMocks());

  it('calls publishRankingsSnapshot with token and params', async () => {
    vi.mocked(publishRankingsSnapshot).mockResolvedValue(undefined);

    const { result } = renderHook(() => usePublishRankingsSnapshot('test-token'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ season: 2024, week: 5 });
    });

    expect(publishRankingsSnapshot).toHaveBeenCalledWith('test-token', 2024, 5);
  });
});

describe('useRefreshCache', () => {
  beforeEach(() => vi.resetAllMocks());

  it('calls refreshCache with token and params', async () => {
    const mockResult = { removedCount: 8, season: 2024, week: 5 };
    vi.mocked(refreshCache).mockResolvedValue(mockResult);

    const { result } = renderHook(() => useRefreshCache('test-token'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ season: 2024, week: 5 });
    });

    expect(refreshCache).toHaveBeenCalledWith('test-token', 2024, 5);
  });

  it('rejects on failure', async () => {
    vi.mocked(refreshCache).mockRejectedValue(new Error('Failed'));

    const { result } = renderHook(() => useRefreshCache('test-token'), {
      wrapper: createWrapper(),
    });

    await expect(
      act(() => result.current.mutateAsync({ season: 2024, week: 5 }))
    ).rejects.toThrow('Failed');
  });
});
