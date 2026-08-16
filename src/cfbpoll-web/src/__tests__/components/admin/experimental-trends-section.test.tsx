import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { rechartsMock } from '../../mocks/recharts';

vi.mock('recharts', () => rechartsMock);

vi.mock('../../../hooks/use-theme', () => ({
  useTheme: () => ({ resolvedTheme: 'light' }),
}));

import type { ExperimentalSeasonTrendsResponse } from '../../../schemas/admin';

import { ExperimentalTrendsSection } from '../../../components/admin';

const mockResult: ExperimentalSeasonTrendsResponse = {
  season: 2024,
  teams: [
    {
      altColor: '#FFFFFF',
      color: '#BB0000',
      conference: 'Big Ten',
      logoURL: 'https://example.com/ohio-state.png',
      rankings: [{ rank: 1, rating: 95.0, record: '8-0', weekNumber: 1 }],
      teamName: 'Ohio State',
    },
  ],
  weeks: [{ label: 'Week 2', weekNumber: 1 }],
};

const defaultProps = {
  isCalculating: false,
  onCalculate: vi.fn(),
  result: null as ExperimentalSeasonTrendsResponse | null,
  selectedSeason: 2024,
};

function renderSection(props = {}) {
  return render(<ExperimentalTrendsSection {...defaultProps} {...props} />);
}

describe('ExperimentalTrendsSection', () => {
  it('calls onCalculate when the button is clicked', () => {
    const onCalculate = vi.fn();
    renderSection({ onCalculate });

    fireEvent.click(screen.getByText('Calculate Season Trend'));

    expect(onCalculate).toHaveBeenCalled();
  });

  it('disables the button when isCalculating is true', () => {
    renderSection({ isCalculating: true });

    expect(screen.getByText('Calculating...')).toBeDisabled();
  });

  it('disables the button when selectedSeason is null', () => {
    renderSection({ selectedSeason: null });

    expect(screen.getByText('Calculate Season Trend')).toBeDisabled();
  });

  it('does not render the chart when result is null', () => {
    renderSection();

    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
  });

  it('renders the chart when result is present', () => {
    renderSection({ result: mockResult });

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('toggles expand/collapse on heading click', () => {
    renderSection({ result: mockResult });

    const heading = screen.getByText('2024 Trend');
    const chevron = () => heading.closest('button')!.querySelector('svg')!;

    expect(chevron().classList.toString()).not.toContain('-rotate-90');

    fireEvent.click(heading);
    expect(chevron().classList.toString()).toContain('-rotate-90');

    fireEvent.click(heading);
    expect(chevron().classList.toString()).not.toContain('-rotate-90');
  });
});
