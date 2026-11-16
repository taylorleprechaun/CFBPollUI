import type { ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { usePredictionCalibrationAnalysis } from '../../hooks/use-prediction-calibration-analysis';

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

const mockAnalysis = {
  backtestWeeks: [],
  candidateValues: null,
  suggestedValues: { paramA: 1.5 },
  suggestionNotes: {},
};

describe('usePredictionCalibrationAnalysis', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('does not fetch when disabled', () => {
    renderHook(() => usePredictionCalibrationAnalysis('test-token', 2026, 10, false), { wrapper: createWrapper() });

    expect(analyzePredictionCalibration).not.toHaveBeenCalled();
  });

  it('does not fetch without a token', () => {
    renderHook(() => usePredictionCalibrationAnalysis(null, 2026, 10, true), { wrapper: createWrapper() });

    expect(analyzePredictionCalibration).not.toHaveBeenCalled();
  });

  it('does not fetch without a week', () => {
    renderHook(() => usePredictionCalibrationAnalysis('test-token', 2026, null, true), { wrapper: createWrapper() });

    expect(analyzePredictionCalibration).not.toHaveBeenCalled();
  });

  it('fetches the suggestion analysis with no values', async () => {
    vi.mocked(analyzePredictionCalibration).mockResolvedValue(mockAnalysis);

    const { result } = renderHook(() => usePredictionCalibrationAnalysis('test-token', 2026, 10, true), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(analyzePredictionCalibration).toHaveBeenCalledWith('test-token', 2026, 10, {});
    expect(result.current.data).toEqual(mockAnalysis);
  });
});
