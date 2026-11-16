import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { rechartsMock } from '../../mocks/recharts';

vi.mock('recharts', () => rechartsMock);

vi.mock('../../../hooks/use-theme', () => ({
  useTheme: () => ({ resolvedTheme: 'light' }),
}));

import { PredictionCalibrationChart } from '../../../components/admin';

describe('PredictionCalibrationChart', () => {
  it('labels the chart and each series', () => {
    render(<PredictionCalibrationChart points={[{ label: 'Wk 9', overUnder: 1, spread: 2, winner: 0 }]} />);

    expect(screen.getByText('Running total of extra correct picks')).toBeInTheDocument();
    expect(screen.getByText('Winner')).toBeInTheDocument();
    expect(screen.getByText('Spread')).toBeInTheDocument();
    expect(screen.getByText('O/U')).toBeInTheDocument();
  });

  it('renders the line chart', () => {
    render(<PredictionCalibrationChart points={[{ label: 'Wk 9', overUnder: 1, spread: 2, winner: 0 }]} />);

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });
});
