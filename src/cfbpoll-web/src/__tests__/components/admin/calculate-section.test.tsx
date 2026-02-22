import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalculateSection } from '../../../components/admin';

const defaultProps = {
  isCalculating: false,
  onCalculate: vi.fn(),
  onSeasonChange: vi.fn(),
  onWeekChange: vi.fn(),
  seasons: [2024, 2023],
  seasonsLoading: false,
  selectedSeason: 2024,
  selectedWeek: 5,
  weeks: [
    { weekNumber: 1, label: 'Week 1' },
    { weekNumber: 5, label: 'Week 5' },
  ],
  weeksLoading: false,
};

describe('CalculateSection', () => {
  it('renders heading', () => {
    render(<CalculateSection {...defaultProps} />);

    expect(screen.getByText('Calculate Rankings')).toBeInTheDocument();
  });

  it('renders season and week selectors', () => {
    render(<CalculateSection {...defaultProps} />);

    expect(screen.getByLabelText('Season')).toBeInTheDocument();
    expect(screen.getByLabelText('Week')).toBeInTheDocument();
  });

  it('calls onCalculate when button is clicked', async () => {
    const onCalculate = vi.fn();
    render(<CalculateSection {...defaultProps} onCalculate={onCalculate} />);

    await userEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    expect(onCalculate).toHaveBeenCalled();
  });

  it('shows Calculating... text when isCalculating is true', () => {
    render(<CalculateSection {...defaultProps} isCalculating={true} />);

    expect(screen.getByRole('button', { name: 'Calculating...' })).toBeDisabled();
  });

  it('disables button when season is null', () => {
    render(<CalculateSection {...defaultProps} selectedSeason={null} />);

    expect(screen.getByRole('button', { name: 'Calculate' })).toBeDisabled();
  });

  it('disables button when week is null', () => {
    render(<CalculateSection {...defaultProps} selectedWeek={null} />);

    expect(screen.getByRole('button', { name: 'Calculate' })).toBeDisabled();
  });

  it('calls onSeasonChange and onWeekChange when season changes', async () => {
    const onSeasonChange = vi.fn();
    const onWeekChange = vi.fn();
    render(<CalculateSection {...defaultProps} onSeasonChange={onSeasonChange} onWeekChange={onWeekChange} />);

    await userEvent.selectOptions(screen.getByLabelText('Season'), '2023');

    expect(onSeasonChange).toHaveBeenCalledWith(2023);
    expect(onWeekChange).toHaveBeenCalledWith(null);
  });

  it('calls onWeekChange when week changes', async () => {
    const onWeekChange = vi.fn();
    render(<CalculateSection {...defaultProps} onWeekChange={onWeekChange} />);

    await userEvent.selectOptions(screen.getByLabelText('Week'), '1');

    expect(onWeekChange).toHaveBeenCalledWith(1);
  });
});
