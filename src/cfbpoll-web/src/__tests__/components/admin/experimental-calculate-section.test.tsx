import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ExperimentalCalculateSection } from '../../../components/admin';

const defaultProps = {
  algorithmVersion: 'V1' as const,
  isCalculating: false,
  onAlgorithmVersionChange: vi.fn(),
  onCalculate: vi.fn(),
  onSeasonChange: vi.fn(),
  onWeekChange: vi.fn(),
  seasons: [2024, 2023],
  seasonsLoading: false,
  selectedSeason: 2024,
  selectedWeek: 5,
  weeks: [
    { weekNumber: 1, label: 'Week 1', predictionsPublished: false, rankingsPublished: true },
    { weekNumber: 5, label: 'Week 5', predictionsPublished: false, rankingsPublished: false },
  ],
  weeksLoading: false,
};

describe('ExperimentalCalculateSection', () => {
  it('calls onAlgorithmVersionChange when algorithm version changes', async () => {
    const onAlgorithmVersionChange = vi.fn();
    render(<ExperimentalCalculateSection {...defaultProps} onAlgorithmVersionChange={onAlgorithmVersionChange} />);

    await userEvent.selectOptions(screen.getByLabelText('Algorithm Version'), 'V2');

    expect(onAlgorithmVersionChange).toHaveBeenCalledWith('V2');
  });

  it('calls onCalculate when button is clicked', async () => {
    const onCalculate = vi.fn();
    render(<ExperimentalCalculateSection {...defaultProps} onCalculate={onCalculate} />);

    await userEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    expect(onCalculate).toHaveBeenCalled();
  });

  it('calls onSeasonChange and onWeekChange when season changes', async () => {
    const onSeasonChange = vi.fn();
    const onWeekChange = vi.fn();
    render(<ExperimentalCalculateSection {...defaultProps} onSeasonChange={onSeasonChange} onWeekChange={onWeekChange} />);

    await userEvent.selectOptions(screen.getByLabelText('Season'), '2023');

    expect(onSeasonChange).toHaveBeenCalledWith(2023);
    expect(onWeekChange).toHaveBeenCalledWith(null);
  });

  it('calls onWeekChange when week changes', async () => {
    const onWeekChange = vi.fn();
    render(<ExperimentalCalculateSection {...defaultProps} onWeekChange={onWeekChange} />);

    await userEvent.selectOptions(screen.getByLabelText('Week'), '1');

    expect(onWeekChange).toHaveBeenCalledWith(1);
  });

  it('disables button when season is null', () => {
    render(<ExperimentalCalculateSection {...defaultProps} selectedSeason={null} />);

    expect(screen.getByRole('button', { name: 'Calculate' })).toBeDisabled();
  });

  it('disables button when week is null', () => {
    render(<ExperimentalCalculateSection {...defaultProps} selectedWeek={null} />);

    expect(screen.getByRole('button', { name: 'Calculate' })).toBeDisabled();
  });

  it('renders heading', () => {
    render(<ExperimentalCalculateSection {...defaultProps} />);

    expect(screen.getByText('Experimental Calculation')).toBeInTheDocument();
  });

  it('renders season, week, and algorithm version selectors', () => {
    render(<ExperimentalCalculateSection {...defaultProps} />);

    expect(screen.getByLabelText('Season')).toBeInTheDocument();
    expect(screen.getByLabelText('Week')).toBeInTheDocument();
    expect(screen.getByLabelText('Algorithm Version')).toBeInTheDocument();
  });

  it('shows Calculating... text when isCalculating is true', () => {
    render(<ExperimentalCalculateSection {...defaultProps} isCalculating={true} />);

    expect(screen.getByRole('button', { name: 'Calculating...' })).toBeDisabled();
  });
});
