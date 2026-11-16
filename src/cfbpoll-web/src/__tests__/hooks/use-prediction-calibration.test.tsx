import type { ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { usePredictionCalibration } from '../../hooks/use-prediction-calibration';

vi.mock('../../services/admin-api', () => ({
  fetchPredictionCalibration: vi.fn(),
}));

import { fetchPredictionCalibration } from '../../services/admin-api';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const mockResponse = {
  carriedFromSeason: null,
  carriedFromWeek: null,
  draftUsesDifferentValues: false,
  isLocked: false,
  isStored: true,
  isSupported: true,
  parameters: [],
  season: 2026,
  source: 'Manual' as const,
  updatedAt: null,
  values: {},
  week: 10,
};

describe('usePredictionCalibration', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('does not fetch when season is null', () => {
    renderHook(() => usePredictionCalibration('test-token', null, 10), { wrapper: createWrapper() });

    expect(fetchPredictionCalibration).not.toHaveBeenCalled();
  });

  it('does not fetch when token is null', () => {
    renderHook(() => usePredictionCalibration(null, 2026, 10), { wrapper: createWrapper() });

    expect(fetchPredictionCalibration).not.toHaveBeenCalled();
  });

  it('does not fetch when week is null', () => {
    renderHook(() => usePredictionCalibration('test-token', 2026, null), { wrapper: createWrapper() });

    expect(fetchPredictionCalibration).not.toHaveBeenCalled();
  });

  it('fetches the calibration for the season and week', async () => {
    vi.mocked(fetchPredictionCalibration).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => usePredictionCalibration('test-token', 2026, 10), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchPredictionCalibration).toHaveBeenCalledWith('test-token', 2026, 10);
    expect(result.current.data).toEqual(mockResponse);
  });
});
