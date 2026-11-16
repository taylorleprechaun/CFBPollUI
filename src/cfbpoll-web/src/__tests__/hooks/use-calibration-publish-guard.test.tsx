import type { ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useCalibrationPublishGuard } from '../../hooks/use-calibration-publish-guard';
import { buildCalibration } from '../fixtures/calibration';

vi.mock('../../services/admin-api', () => ({
  fetchPredictionCalibration: vi.fn(),
}));

import { fetchPredictionCalibration } from '../../services/admin-api';

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useCalibrationPublishGuard', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('asks for confirmation when the draft used different values, then publishes once confirmed', async () => {
    vi.mocked(fetchPredictionCalibration).mockResolvedValue(buildCalibration({ draftUsesDifferentValues: true }));
    const onPublish = vi.fn();
    const { result } = renderHook(() => useCalibrationPublishGuard('test-token', onPublish), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.requestPublish(2026, 10, 'feedback');
    });

    expect(onPublish).not.toHaveBeenCalled();
    expect(result.current.pendingPublish).toEqual({ feedbackKeyPrefix: 'feedback', season: 2026, week: 10 });

    act(() => result.current.confirmPublish());

    expect(onPublish).toHaveBeenCalledWith(2026, 10, 'feedback');
    expect(result.current.pendingPublish).toBeNull();
  });

  it('cancels a pending publish without publishing', async () => {
    vi.mocked(fetchPredictionCalibration).mockResolvedValue(buildCalibration({ draftUsesDifferentValues: true }));
    const onPublish = vi.fn();
    const { result } = renderHook(() => useCalibrationPublishGuard('test-token', onPublish), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.requestPublish(2026, 10, 'feedback');
    });
    act(() => result.current.cancelPublish());

    expect(result.current.pendingPublish).toBeNull();
    expect(onPublish).not.toHaveBeenCalled();
  });

  it('publishes anyway when the calibration check fails', async () => {
    vi.mocked(fetchPredictionCalibration).mockRejectedValue(new Error('Server unavailable'));
    const onPublish = vi.fn();
    const { result } = renderHook(() => useCalibrationPublishGuard('test-token', onPublish), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.requestPublish(2026, 10, 'feedback');
    });

    expect(onPublish).toHaveBeenCalledWith(2026, 10, 'feedback');
  });

  it('publishes straight away when the draft matches the saved values', async () => {
    vi.mocked(fetchPredictionCalibration).mockResolvedValue(buildCalibration());
    const onPublish = vi.fn();
    const { result } = renderHook(() => useCalibrationPublishGuard('test-token', onPublish), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.requestPublish(2026, 10, 'feedback');
    });

    expect(fetchPredictionCalibration).toHaveBeenCalledWith('test-token', 2026, 10);
    expect(onPublish).toHaveBeenCalledWith(2026, 10, 'feedback');
    expect(result.current.pendingPublish).toBeNull();
  });
});
