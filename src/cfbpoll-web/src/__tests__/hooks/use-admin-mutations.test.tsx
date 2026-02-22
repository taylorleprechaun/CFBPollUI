import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  useCalculateRankings,
  usePublishSnapshot,
  useDeleteSnapshot,
  useExportSnapshot,
} from '../../hooks/use-admin-mutations';

vi.mock('../../services/admin-api', () => ({
  calculateRankings: vi.fn(),
  publishSnapshot: vi.fn(),
  deleteSnapshot: vi.fn(),
  downloadExport: vi.fn(),
}));

import {
  calculateRankings,
  publishSnapshot,
  deleteSnapshot,
  downloadExport,
} from '../../services/admin-api';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useCalculateRankings', () => {
  beforeEach(() => vi.resetAllMocks());

  it('calls calculateRankings with token and params', async () => {
    const mockResult = { persisted: true, rankings: { season: 2024, week: 5, rankings: [] } };
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

describe('usePublishSnapshot', () => {
  beforeEach(() => vi.resetAllMocks());

  it('calls publishSnapshot with token and params', async () => {
    vi.mocked(publishSnapshot).mockResolvedValue(undefined);

    const { result } = renderHook(() => usePublishSnapshot('test-token'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ season: 2024, week: 5 });
    });

    expect(publishSnapshot).toHaveBeenCalledWith('test-token', 2024, 5);
  });
});

describe('useDeleteSnapshot', () => {
  beforeEach(() => vi.resetAllMocks());

  it('calls deleteSnapshot with token and params', async () => {
    vi.mocked(deleteSnapshot).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteSnapshot('test-token'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ season: 2024, week: 5 });
    });

    expect(deleteSnapshot).toHaveBeenCalledWith('test-token', 2024, 5);
  });
});

describe('useExportSnapshot', () => {
  beforeEach(() => vi.resetAllMocks());

  it('calls downloadExport with token and params', async () => {
    vi.mocked(downloadExport).mockResolvedValue(undefined);

    const { result } = renderHook(() => useExportSnapshot('test-token'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ season: 2024, week: 5 });
    });

    expect(downloadExport).toHaveBeenCalledWith('test-token', 2024, 5);
  });
});

describe('null token guard', () => {
  beforeEach(() => vi.resetAllMocks());

  it('useCalculateRankings rejects with Authentication required when token is null', async () => {
    const { result } = renderHook(() => useCalculateRankings(null), {
      wrapper: createWrapper(),
    });

    await expect(
      act(() => result.current.mutateAsync({ season: 2024, week: 5 }))
    ).rejects.toThrow('Authentication required');

    expect(calculateRankings).not.toHaveBeenCalled();
  });

  it('usePublishSnapshot rejects with Authentication required when token is null', async () => {
    const { result } = renderHook(() => usePublishSnapshot(null), {
      wrapper: createWrapper(),
    });

    await expect(
      act(() => result.current.mutateAsync({ season: 2024, week: 5 }))
    ).rejects.toThrow('Authentication required');

    expect(publishSnapshot).not.toHaveBeenCalled();
  });

  it('useDeleteSnapshot rejects with Authentication required when token is null', async () => {
    const { result } = renderHook(() => useDeleteSnapshot(null), {
      wrapper: createWrapper(),
    });

    await expect(
      act(() => result.current.mutateAsync({ season: 2024, week: 5 }))
    ).rejects.toThrow('Authentication required');

    expect(deleteSnapshot).not.toHaveBeenCalled();
  });

  it('useExportSnapshot rejects with Authentication required when token is null', async () => {
    const { result } = renderHook(() => useExportSnapshot(null), {
      wrapper: createWrapper(),
    });

    await expect(
      act(() => result.current.mutateAsync({ season: 2024, week: 5 }))
    ).rejects.toThrow('Authentication required');

    expect(downloadExport).not.toHaveBeenCalled();
  });
});
