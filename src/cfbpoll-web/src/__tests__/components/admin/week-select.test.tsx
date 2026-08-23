import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { WeekSelect } from '../../../components/admin';

const weeks = [
  { weekNumber: 1, label: 'Week 1', predictionsPublished: false, rankingsPublished: true },
  { weekNumber: 5, label: 'Week 5', predictionsPublished: false, rankingsPublished: false },
];

describe('WeekSelect', () => {
  it('calls onWeekChange when a week is selected', async () => {
    const onWeekChange = vi.fn();
    render(<WeekSelect onWeekChange={onWeekChange} selectedWeek={1} weeks={weeks} weeksLoading={false} />);

    await userEvent.selectOptions(screen.getByLabelText('Week'), '5');

    expect(onWeekChange).toHaveBeenCalledWith(5);
  });

  it('disables the select while weeks are loading', () => {
    render(<WeekSelect onWeekChange={vi.fn()} selectedWeek={null} weeks={weeks} weeksLoading={true} />);

    expect(screen.getByLabelText('Week')).toBeDisabled();
  });

  it('renders an info tooltip explaining the scheduling gap', () => {
    render(<WeekSelect onWeekChange={vi.fn()} selectedWeek={1} weeks={weeks} weeksLoading={false} />);

    expect(screen.getByRole('button', { name: 'About Week scheduling gap' })).toBeInTheDocument();
  });

  it('renders an option for every week', () => {
    render(<WeekSelect onWeekChange={vi.fn()} selectedWeek={1} weeks={weeks} weeksLoading={false} />);

    expect(screen.getByRole('option', { name: 'Week 1' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Week 5' })).toBeInTheDocument();
  });
});
