import type { ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAnalyzePredictionCalibration } from '../../hooks/use-analyze-prediction-calibration';

vi.mock('../../services/admin-api', () => ({
  analyzePredictionCalibration: vi.fn(),
}));

import { analyzePredictionCalibration } from '../../services/admin-api';

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useAnalyzePredictionCalibration', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('calls analyzePredictionCalibration with the typed values', async () => {
    vi.mocked(analyzePredictionCalibration).mockResolvedValue({
      backtestWeeks: [],
      candidateValues: { paramA: 1 },
      suggestedValues: {},
      suggestionNotes: {},
    });

    const { result } = renderHook(() => useAnalyzePredictionCalibration('test-token'), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.mutateAsync({ season: 2026, values: { paramA: 1 }, week: 10 });
    });

    expect(analyzePredictionCalibration).toHaveBeenCalledWith('test-token', 2026, 10, { values: { paramA: 1 } });
  });

  it('rejects with Authentication required when token is null', async () => {
    const { result } = renderHook(() => useAnalyzePredictionCalibration(null), { wrapper: createWrapper() });

    await expect(
      act(() => result.current.mutateAsync({ season: 2026, values: { paramA: 1 }, week: 10 }))
    ).rejects.toThrow('Authentication required');
  });
});
