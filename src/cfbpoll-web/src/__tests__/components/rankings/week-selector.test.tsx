import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { WeekSelector } from '../../../components/rankings/week-selector';

describe('WeekSelector', () => {
  const defaultProps = {
    weeks: [
      { weekNumber: 1, label: 'Week 2', predictionsPublished: true, rankingsPublished: true },
      { weekNumber: 5, label: 'Week 6', predictionsPublished: true, rankingsPublished: true },
    ],
    selectedWeek: 1,
    onWeekChange: vi.fn(),
    isLoading: false,
  };

  it('renders week options', () => {
    render(<WeekSelector {...defaultProps} />);

    expect(screen.getByLabelText('Week:')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Week 2' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Week 6' })).toBeInTheDocument();
  });

  it('calls onWeekChange when a week is selected', async () => {
    render(<WeekSelector {...defaultProps} />);

    await userEvent.selectOptions(screen.getByLabelText('Week:'), '5');

    expect(defaultProps.onWeekChange).toHaveBeenCalledWith(5);
  });

  it('shows loading option and disables select when isLoading is true', () => {
    render(<WeekSelector {...defaultProps} isLoading={true} weeks={[]} />);

    const select = screen.getByLabelText('Week:');
    expect(select).toBeDisabled();
    expect(screen.getByRole('option', { name: 'Loading...' })).toBeInTheDocument();
  });

  it('shows a select-a-season placeholder and disables select when there are no weeks', () => {
    render(<WeekSelector {...defaultProps} weeks={[]} selectedWeek={null} />);

    const select = screen.getByLabelText('Week:');
    expect(select).toBeDisabled();
    expect(screen.getByRole('option', { name: 'Select a season' })).toBeInTheDocument();
  });

  it('renders without error when selectedWeek is null', () => {
    render(<WeekSelector {...defaultProps} selectedWeek={null} />);

    const select = screen.getByLabelText('Week:') as HTMLSelectElement;
    expect(select.value).toBe('1');
  });
});
