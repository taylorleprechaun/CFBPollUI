import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PredictionCalibrationResponse } from '../../../schemas/admin';

import { PredictionCalibrationSummary } from '../../../components/admin';
import { buildCalibration } from '../../fixtures/calibration';

let mockCalibration: PredictionCalibrationResponse | undefined = undefined;
let mockError: Error | null = null;

vi.mock('../../../hooks/use-prediction-calibration', () => ({
  usePredictionCalibration: () => ({ data: mockCalibration, error: mockError, isLoading: false }),
}));

/**
 * Week 10 showing values carried forward from week 9 and not saved yet.
 */
function buildCarriedCalibration(overrides: Partial<PredictionCalibrationResponse> = {}): PredictionCalibrationResponse {
  return buildCalibration({
    carriedFromSeason: 2026,
    carriedFromWeek: 9,
    isStored: false,
    source: 'CarriedForward',
    updatedAt: null,
    values: { paramA: 2, paramB: -2 },
    ...overrides,
  });
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
    mockCalibration = buildCarriedCalibration();
    mockError = null;
  });

  it('flags a carried-forward week as not reviewed', () => {
    renderSummary();

    expect(screen.getByText(/Not reviewed for this week yet/)).toBeInTheDocument();
  });

  it('labels the link View calibration once the week is locked', () => {
    mockCalibration = buildCarriedCalibration({ isLocked: true });

    renderSummary();

    expect(screen.getByRole('link', { name: 'View calibration' })).toBeInTheDocument();
  });

  it('links to the calibration page for the same season and week', () => {
    renderSummary();

    expect(screen.getByRole('link', { name: 'Edit calibration' })).toHaveAttribute('href', '/admin/calibration?season=2026&week=10');
  });

  it.each([
    ['has its own values', { isStored: true, source: 'Manual' as const }],
    ['is locked', { isLocked: true }],
  ])('omits the not-reviewed note when the week %s', (_, overrides) => {
    mockCalibration = buildCarriedCalibration(overrides);

    renderSummary();

    expect(screen.queryByText(/Not reviewed for this week yet/)).not.toBeInTheDocument();
  });

  it('renders nothing when the season does not support calibration', () => {
    mockCalibration = buildCarriedCalibration({ isSupported: false, parameters: [] });

    const { container } = renderSummary();

    expect(container).toBeEmptyDOMElement();
  });

  it('shows the draft mismatch warning', () => {
    mockCalibration = buildCarriedCalibration({ draftUsesDifferentValues: true });

    renderSummary();

    expect(screen.getByText(/generated with different calibration values/)).toBeInTheDocument();
  });

  it('shows the load error', () => {
    mockCalibration = undefined;
    mockError = new Error('Server unavailable');

    renderSummary();

    expect(screen.getByRole('alert')).toHaveTextContent('Failed to load calibration');
  });

  it('shows the published mismatch wording once the week is locked', () => {
    mockCalibration = buildCarriedCalibration({ draftUsesDifferentValues: true, isLocked: true });

    renderSummary();

    expect(screen.getByText(/The published predictions for this week were generated with different calibration values/)).toBeInTheDocument();
  });

  it('shows the values and where they were carried forward from', () => {
    renderSummary();

    expect(screen.getByText(/Param A \+2 · Param B -2/)).toBeInTheDocument();
    expect(screen.getByText(/Carried forward from 2026 Week 10, not saved yet/)).toBeInTheDocument();
    expect(screen.queryByText(/generated with different calibration values/)).not.toBeInTheDocument();
  });
});
