import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';

import {
  invalidateCalibrationAfterPredictionChange,
  invalidateCalibrationAfterPublish,
  invalidateCalibrationAfterSave,
} from '../../lib/calibration-query-utils';

function isInvalidated(queryClient: QueryClient, queryKey: unknown[]) {
  return queryClient.getQueryState(queryKey)?.isInvalidated;
}

/**
 * Seeds calibration views, analyses and histories around 2024 week 3 so tests can check which were refreshed.
 */
function seedQueries() {
  const queryClient = new QueryClient();
  queryClient.setQueryData(['prediction-calibration', 2024, 2], {});
  queryClient.setQueryData(['prediction-calibration', 2024, 3], {});
  queryClient.setQueryData(['prediction-calibration', 2024, 5], {});
  queryClient.setQueryData(['prediction-calibration', 2025, 1], {});
  queryClient.setQueryData(['prediction-calibration-analysis', 2024, 3], {});
  queryClient.setQueryData(['prediction-calibration-analysis', 2024, 5], {});
  queryClient.setQueryData(['prediction-calibration-history', 2023], []);
  queryClient.setQueryData(['prediction-calibration-history', 2024], []);
  return queryClient;
}

describe('invalidateCalibrationAfterPredictionChange', () => {
  it('leaves earlier weeks, the week’s own analysis and other seasons’ history alone', () => {
    const queryClient = seedQueries();

    invalidateCalibrationAfterPredictionChange(queryClient, 2024, 3);

    expect(isInvalidated(queryClient, ['prediction-calibration', 2024, 2])).toBe(false);
    expect(isInvalidated(queryClient, ['prediction-calibration-analysis', 2024, 3])).toBe(false);
    expect(isInvalidated(queryClient, ['prediction-calibration-history', 2023])).toBe(false);
  });

  it('refreshes the week, later weeks including later seasons, their analyses and the season history', () => {
    const queryClient = seedQueries();

    invalidateCalibrationAfterPredictionChange(queryClient, 2024, 3);

    expect(isInvalidated(queryClient, ['prediction-calibration', 2024, 3])).toBe(true);
    expect(isInvalidated(queryClient, ['prediction-calibration', 2024, 5])).toBe(true);
    expect(isInvalidated(queryClient, ['prediction-calibration', 2025, 1])).toBe(true);
    expect(isInvalidated(queryClient, ['prediction-calibration-analysis', 2024, 5])).toBe(true);
    expect(isInvalidated(queryClient, ['prediction-calibration-history', 2024])).toBe(true);
  });
});

describe('invalidateCalibrationAfterPublish', () => {
  it('refreshes only the week and the season history', () => {
    const queryClient = seedQueries();

    invalidateCalibrationAfterPublish(queryClient, 2024, 3);

    expect(isInvalidated(queryClient, ['prediction-calibration', 2024, 3])).toBe(true);
    expect(isInvalidated(queryClient, ['prediction-calibration-history', 2024])).toBe(true);
    expect(isInvalidated(queryClient, ['prediction-calibration', 2024, 5])).toBe(false);
    expect(isInvalidated(queryClient, ['prediction-calibration-analysis', 2024, 5])).toBe(false);
  });
});

describe('invalidateCalibrationAfterSave', () => {
  it('leaves the saved week and earlier weeks alone', () => {
    const queryClient = seedQueries();

    invalidateCalibrationAfterSave(queryClient, 2024, 3);

    expect(isInvalidated(queryClient, ['prediction-calibration', 2024, 2])).toBe(false);
    expect(isInvalidated(queryClient, ['prediction-calibration', 2024, 3])).toBe(false);
    expect(isInvalidated(queryClient, ['prediction-calibration-analysis', 2024, 3])).toBe(false);
  });

  it('refreshes later weeks including later seasons, their analyses and the season history', () => {
    const queryClient = seedQueries();

    invalidateCalibrationAfterSave(queryClient, 2024, 3);

    expect(isInvalidated(queryClient, ['prediction-calibration', 2024, 5])).toBe(true);
    expect(isInvalidated(queryClient, ['prediction-calibration', 2025, 1])).toBe(true);
    expect(isInvalidated(queryClient, ['prediction-calibration-analysis', 2024, 5])).toBe(true);
    expect(isInvalidated(queryClient, ['prediction-calibration-history', 2024])).toBe(true);
  });
});
