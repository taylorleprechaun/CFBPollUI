import type { ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { usePredictionCalibrationHistory } from '../../hooks/use-prediction-calibration-history';

vi.mock('../../services/admin-api', () => ({
  fetchPredictionCalibrationHistory: vi.fn(),
}));

import { fetchPredictionCalibrationHistory } from '../../services/admin-api';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('usePredictionCalibrationHistory', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('does not fetch when disabled', () => {
    renderHook(() => usePredictionCalibrationHistory('test-token', 2026, false), { wrapper: createWrapper() });

    expect(fetchPredictionCalibrationHistory).not.toHaveBeenCalled();
  });

  it('does not fetch when season is null', () => {
    renderHook(() => usePredictionCalibrationHistory('test-token', null, true), { wrapper: createWrapper() });

    expect(fetchPredictionCalibrationHistory).not.toHaveBeenCalled();
  });

  it('does not fetch when token is null', () => {
    renderHook(() => usePredictionCalibrationHistory(null, 2026, true), { wrapper: createWrapper() });

    expect(fetchPredictionCalibrationHistory).not.toHaveBeenCalled();
  });

  it('fetches the season history when enabled', async () => {
    const entries = [{ isLocked: true, season: 2026, source: 'Manual' as const, updatedAt: null, values: {}, week: 9 }];
    vi.mocked(fetchPredictionCalibrationHistory).mockResolvedValue(entries);

    const { result } = renderHook(() => usePredictionCalibrationHistory('test-token', 2026, true), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchPredictionCalibrationHistory).toHaveBeenCalledWith('test-token', 2026);
    expect(result.current.data).toEqual(entries);
  });
});
