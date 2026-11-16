import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PredictionCalibrationResponse } from '../../../schemas/admin';

import { PredictionCalibrationSummary } from '../../../components/admin';

let mockCalibration: PredictionCalibrationResponse | undefined = undefined;
let mockError: Error | null = null;

vi.mock('../../../hooks/use-prediction-calibration', () => ({
  usePredictionCalibration: () => ({ data: mockCalibration, error: mockError, isLoading: false }),
}));

function buildCalibration(overrides: Partial<PredictionCalibrationResponse> = {}): PredictionCalibrationResponse {
  return {
    carriedFromSeason: 2026,
    carriedFromWeek: 9,
    draftUsesDifferentValues: false,
    isLocked: false,
    isStored: false,
    isSupported: true,
    parameters: [
      { defaultValue: 0, description: '', key: 'paramA', label: 'Param A', max: 5, min: -5, step: 0.1 },
      { defaultValue: 0, description: '', key: 'paramB', label: 'Param B', max: 10, min: -10, step: 0.1 },
    ],
    season: 2026,
    source: 'CarriedForward',
    updatedAt: null,
    values: { paramA: 2, paramB: -2 },
    week: 10,
    ...overrides,
  };
}

function renderSummary() {
  return render(
    <MemoryRouter>
      <PredictionCalibrationSummary season={2026} token="test-token" week={10} />
    </MemoryRouter>
  );
}

describe('PredictionCalibrationSummary', () => {
  beforeEach(() => {
    mockCalibration = buildCalibration();
    mockError = null;
  });

  it('labels the link View calibration once the week is locked', () => {
    mockCalibration = buildCalibration({ isLocked: true });

    renderSummary();

    expect(screen.getByRole('link', { name: 'View calibration' })).toBeInTheDocument();
  });

  it('links to the calibration page for the same season and week', () => {
    renderSummary();

    expect(screen.getByRole('link', { name: 'Edit calibration' })).toHaveAttribute('href', '/admin/calibration?season=2026&week=10');
  });

  it('renders nothing when the season does not support calibration', () => {
    mockCalibration = buildCalibration({ isSupported: false, parameters: [] });

    const { container } = renderSummary();

    expect(container).toBeEmptyDOMElement();
  });

  it('shows the draft mismatch warning', () => {
    mockCalibration = buildCalibration({ draftUsesDifferentValues: true });

    renderSummary();

    expect(screen.getByText(/generated with different calibration values/)).toBeInTheDocument();
  });

  it('shows the load error', () => {
    mockCalibration = undefined;
    mockError = new Error('Server unavailable');

    renderSummary();

    expect(screen.getByRole('alert')).toHaveTextContent('Failed to load calibration');
  });

  it('shows the values and where they were carried forward from', () => {
    renderSummary();

    expect(screen.getByText(/Param A \+2 · Param B -2/)).toBeInTheDocument();
    expect(screen.getByText(/Carried forward from 2026 Week 10, not saved yet/)).toBeInTheDocument();
    expect(screen.queryByText(/generated with different calibration values/)).not.toBeInTheDocument();
  });
});
