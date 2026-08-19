import type { ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  useCalculateExperimental,
  useCalculateExperimentalPredictions,
  useCalculateExperimentalSeasonTrends,
  useExportExperimental,
} from '../../hooks/use-experimental-mutations';

vi.mock('../../services/admin-api', () => ({
  calculateExperimental: vi.fn(),
  calculateExperimentalPredictions: vi.fn(),
  calculateExperimentalSeasonTrends: vi.fn(),
  downloadExperimentalExport: vi.fn(),
}));

import {
  calculateExperimental,
  calculateExperimentalPredictions,
  calculateExperimentalSeasonTrends,
  downloadExperimentalExport,
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

  it('useCalculateExperimental rejects with Authentication required when token is null', async () => {
    const { result } = renderHook(() => useCalculateExperimental(null), {
      wrapper: createWrapper(),
    });

    await expect(
      act(() => result.current.mutateAsync({ algorithmVersion: 'V1', season: 2024, week: 5 }))
    ).rejects.toThrow('Authentication required');

    expect(calculateExperimental).not.toHaveBeenCalled();
  });

  it('useCalculateExperimentalPredictions rejects with Authentication required when token is null', async () => {
    const { result } = renderHook(() => useCalculateExperimentalPredictions(null), {
      wrapper: createWrapper(),
    });

    await expect(
      act(() => result.current.mutateAsync({ algorithmVersion: 'V1', season: 2024, week: 5 }))
    ).rejects.toThrow('Authentication required');

    expect(calculateExperimentalPredictions).not.toHaveBeenCalled();
  });

  it('useCalculateExperimentalSeasonTrends rejects with Authentication required when token is null', async () => {
    const { result } = renderHook(() => useCalculateExperimentalSeasonTrends(null), {
      wrapper: createWrapper(),
    });

    await expect(
      act(() => result.current.mutateAsync({ algorithmVersion: 'V1', season: 2024 }))
    ).rejects.toThrow('Authentication required');

    expect(calculateExperimentalSeasonTrends).not.toHaveBeenCalled();
  });

  it('useExportExperimental rejects with Authentication required when token is null', async () => {
    const { result } = renderHook(() => useExportExperimental(null), {
      wrapper: createWrapper(),
    });

    await expect(
      act(() => result.current.mutateAsync({ algorithmVersion: 'V1', season: 2024, week: 5 }))
    ).rejects.toThrow('Authentication required');

    expect(downloadExperimentalExport).not.toHaveBeenCalled();
  });
});

describe('useCalculateExperimental', () => {
  beforeEach(() => vi.resetAllMocks());

  it('calls calculateExperimental with token and params', async () => {
    const mockResult = { algorithmVersion: 'V2', rankings: { season: 2024, week: 5, rankings: [] } };
    vi.mocked(calculateExperimental).mockResolvedValue(mockResult);

    const { result } = renderHook(() => useCalculateExperimental('test-token'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ algorithmVersion: 'V2', season: 2024, week: 5 });
    });

    expect(calculateExperimental).toHaveBeenCalledWith('test-token', 2024, 5, 'V2');
  });

  it('rejects on failure', async () => {
    vi.mocked(calculateExperimental).mockRejectedValue(new Error('Failed'));

    const { result } = renderHook(() => useCalculateExperimental('test-token'), {
      wrapper: createWrapper(),
    });

    await expect(
      act(() => result.current.mutateAsync({ algorithmVersion: 'V1', season: 2024, week: 5 }))
    ).rejects.toThrow('Failed');
  });
});

describe('useCalculateExperimentalPredictions', () => {
  beforeEach(() => vi.resetAllMocks());

  it('calls calculateExperimentalPredictions with token and params', async () => {
    const mockResult = {
      algorithmVersion: 'V2',
      predictions: [],
      summary: {
        gradedGameCount: 0,
        marginBias: null,
        marginMAE: null,
        marginRMSE: null,
        overUnder: { correct: 0, incorrect: 0, push: 0 },
        spread: { correct: 0, incorrect: 0, push: 0 },
        winner: { correct: 0, incorrect: 0, push: 0 },
      },
    };
    vi.mocked(calculateExperimentalPredictions).mockResolvedValue(mockResult);

    const { result } = renderHook(() => useCalculateExperimentalPredictions('test-token'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ algorithmVersion: 'V2', season: 2024, week: 5 });
    });

    expect(calculateExperimentalPredictions).toHaveBeenCalledWith('test-token', 2024, 5, 'V2');
  });

  it('rejects on failure', async () => {
    vi.mocked(calculateExperimentalPredictions).mockRejectedValue(new Error('Failed'));

    const { result } = renderHook(() => useCalculateExperimentalPredictions('test-token'), {
      wrapper: createWrapper(),
    });

    await expect(
      act(() => result.current.mutateAsync({ algorithmVersion: 'V1', season: 2024, week: 5 }))
    ).rejects.toThrow('Failed');
  });
});

describe('useCalculateExperimentalSeasonTrends', () => {
  beforeEach(() => vi.resetAllMocks());

  it('calls calculateExperimentalSeasonTrends with token and params', async () => {
    const mockResult = { season: 2024, teams: [], weeks: [] };
    vi.mocked(calculateExperimentalSeasonTrends).mockResolvedValue(mockResult);

    const { result } = renderHook(() => useCalculateExperimentalSeasonTrends('test-token'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ algorithmVersion: 'V2', season: 2024 });
    });

    expect(calculateExperimentalSeasonTrends).toHaveBeenCalledWith('test-token', 2024, 'V2');
  });

  it('rejects on failure', async () => {
    vi.mocked(calculateExperimentalSeasonTrends).mockRejectedValue(new Error('Failed'));

    const { result } = renderHook(() => useCalculateExperimentalSeasonTrends('test-token'), {
      wrapper: createWrapper(),
    });

    await expect(
      act(() => result.current.mutateAsync({ algorithmVersion: 'V1', season: 2024 }))
    ).rejects.toThrow('Failed');
  });
});

describe('useExportExperimental', () => {
  beforeEach(() => vi.resetAllMocks());

  it('calls downloadExperimentalExport with token and params', async () => {
    vi.mocked(downloadExperimentalExport).mockResolvedValue(undefined);

    const { result } = renderHook(() => useExportExperimental('test-token'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ algorithmVersion: 'V2', season: 2024, week: 5 });
    });

    expect(downloadExperimentalExport).toHaveBeenCalledWith('test-token', 2024, 5, 'V2');
  });

  it('rejects on failure', async () => {
    vi.mocked(downloadExperimentalExport).mockRejectedValue(new Error('Failed'));

    const { result } = renderHook(() => useExportExperimental('test-token'), {
      wrapper: createWrapper(),
    });

    await expect(
      act(() => result.current.mutateAsync({ algorithmVersion: 'V1', season: 2024, week: 5 }))
    ).rejects.toThrow('Failed');
  });
});
