import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { rechartsMock } from '../../mocks/recharts';

vi.mock('recharts', () => rechartsMock);

vi.mock('../../../hooks/use-theme', () => ({
  useTheme: () => ({ resolvedTheme: 'light' }),
}));

import { PredictionCalibrationChart } from '../../../components/admin';

const points = [
  { label: 'Wk 8', overUnder: -3, spread: 2, winner: 1 },
  { label: 'Wk 9', overUnder: 4, spread: -1, winner: -2 },
  { label: 'Wk 10', overUnder: 0, spread: 0, winner: 0 },
];

function barFills() {
  return screen.getAllByTestId('bar-cell').map((c) => c.getAttribute('fill'));
}

describe('PredictionCalibrationChart', () => {
  it('charts the spread by default, coloring gains and even weeks green and losses red', () => {
    render(<PredictionCalibrationChart comparedLabel="the suggestions" points={points} />);

    expect(screen.getByRole('button', { name: 'Spread' })).toHaveAttribute('aria-pressed', 'true');
    expect(barFills()).toEqual(['#16a34a', '#dc2626', '#16a34a']);
  });

  it('explains how the bars relate to the table', () => {
    render(<PredictionCalibrationChart comparedLabel="the suggestions" points={points} />);

    expect(screen.getByText(/the same number as the Spread column below/)).toHaveTextContent('where the suggestions would have gotten more spreads right');
  });

  it('switches to another record when chosen', async () => {
    render(<PredictionCalibrationChart comparedLabel="the suggestions" points={points} />);

    await userEvent.click(screen.getByRole('button', { name: 'O/U' }));

    expect(barFills()).toEqual(['#dc2626', '#16a34a', '#16a34a']);
    expect(screen.getByText(/the same number as the O\/U column below/)).toHaveTextContent('more over/unders right');
  });
});
