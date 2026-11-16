import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PredictionCalibrationHistory } from '../../../components/admin';

const parameters = [
  { defaultValue: 0, description: '', key: 'paramA', label: 'Param A', max: 5, min: -5, step: 0.1 },
  { defaultValue: 0, description: '', key: 'paramB', label: 'Param B', max: 10, min: -10, step: 0.1 },
];

describe('PredictionCalibrationHistory', () => {
  it('renders a row per week with formatted values, source and lock status', () => {
    render(
      <PredictionCalibrationHistory
        entries={[
          { carriedFromSeason: 2026, carriedFromWeek: 6, isLocked: true, season: 2026, source: 'CarriedForward', updatedAt: null, values: { paramA: 0, paramB: -1.25 }, week: 8 },
          { carriedFromSeason: null, carriedFromWeek: null, isLocked: false, season: 2026, source: 'Manual', updatedAt: null, values: { paramA: 2 }, week: 9 },
        ]}
        isLoading={false}
        parameters={parameters}
      />
    );

    const rows = screen.getAllByRole('row').slice(1);
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText('-1.25')).toBeInTheDocument();
    expect(within(rows[0]).getByText('Carried forward from 2026 Week 7')).toBeInTheDocument();
    expect(within(rows[0]).getByText('Locked')).toBeInTheDocument();
    expect(within(rows[1]).getByText('+2')).toBeInTheDocument();
    expect(within(rows[1]).getByText('-')).toBeInTheDocument();
    expect(within(rows[1]).getByText('Editable')).toBeInTheDocument();
  });

  it('shows a loading message while loading', () => {
    render(<PredictionCalibrationHistory entries={[]} isLoading parameters={parameters} />);

    expect(screen.getByText('Loading history...')).toBeInTheDocument();
  });

  it('shows an empty message when nothing is saved', () => {
    render(<PredictionCalibrationHistory entries={[]} isLoading={false} parameters={parameters} />);

    expect(screen.getByText('No calibration saved for this season yet.')).toBeInTheDocument();
  });
});
