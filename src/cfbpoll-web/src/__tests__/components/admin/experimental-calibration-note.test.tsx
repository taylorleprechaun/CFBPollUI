import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PredictionCalibrationResponse } from '../../../schemas/admin';

import { ExperimentalCalibrationNote } from '../../../components/admin';
import { buildCalibration } from '../../fixtures/calibration';

let mockCalibration: PredictionCalibrationResponse | undefined = undefined;

vi.mock('../../../hooks/use-auth', () => ({
  useAuth: () => ({ token: 'test-token' }),
}));

vi.mock('../../../hooks/use-prediction-calibration', () => ({
  usePredictionCalibration: () => ({ data: mockCalibration }),
}));

function renderNote() {
  return render(
    <MemoryRouter>
      <ExperimentalCalibrationNote appliedCalibration={{ paramA: 1.5, paramB: -0.8 }} season={2026} week={10} />
    </MemoryRouter>
  );
}

describe('ExperimentalCalibrationNote', () => {
  beforeEach(() => {
    mockCalibration = buildCalibration();
  });

  it('falls back to the raw keys before the labels load', () => {
    mockCalibration = undefined;

    renderNote();

    expect(screen.getByText(/Calibration: paramA 1.5 · paramB -0.8/)).toBeInTheDocument();
  });

  it('links to the week on the Calibration page', () => {
    renderNote();

    const link = screen.getByRole('link', { name: 'Edit calibration for 2026 Week 11' });
    expect(link).toHaveAttribute('href', '/admin/calibration?season=2026&week=10');
    expect(link).toHaveTextContent('Edit');
  });

  it('offers to view rather than edit a locked week', () => {
    mockCalibration = buildCalibration({ isLocked: true });

    renderNote();

    expect(screen.getByRole('link', { name: 'View calibration for 2026 Week 11' })).toBeInTheDocument();
  });

  it('shows the applied values with their labels', () => {
    renderNote();

    expect(screen.getByText(/^Calibration: Param A \+1.5 · Param B -0.8/)).toBeInTheDocument();
  });
});
