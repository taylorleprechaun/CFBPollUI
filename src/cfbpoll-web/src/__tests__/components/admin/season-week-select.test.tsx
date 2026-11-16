import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SeasonWeekSelect } from '../../../components/admin';

const weeks = [
  { isComplete: true, label: 'Week 2', predictionsPublished: false, rankingsPublished: false, weekNumber: 1 },
  { isComplete: false, label: 'Week 3', predictionsPublished: false, rankingsPublished: false, weekNumber: 2 },
];

function renderSelect(overrides: Partial<Parameters<typeof SeasonWeekSelect>[0]> = {}) {
  const props = {
    onSeasonChange: vi.fn(),
    onWeekChange: vi.fn(),
    seasons: [2026, 2025],
    seasonsLoading: false,
    selectedSeason: 2026,
    selectedWeek: 1,
    weeks,
    weeksLoading: false,
    ...overrides,
  };
  render(<SeasonWeekSelect {...props} />);
  return props;
}

describe('SeasonWeekSelect', () => {
  it('calls onSeasonChange with the chosen season', async () => {
    const props = renderSelect();

    await userEvent.selectOptions(screen.getByLabelText('Season'), '2025');

    expect(props.onSeasonChange).toHaveBeenCalledWith(2025);
  });

  it('calls onWeekChange with the chosen week', async () => {
    const props = renderSelect();

    await userEvent.selectOptions(screen.getByLabelText('Week'), '2');

    expect(props.onWeekChange).toHaveBeenCalledWith(2);
  });

  it('disables the season select while seasons load', () => {
    renderSelect({ seasonsLoading: true });

    expect(screen.getByLabelText('Season')).toBeDisabled();
  });

  it('shows the selected season and week', () => {
    renderSelect();

    expect(screen.getByLabelText('Season')).toHaveValue('2026');
    expect(screen.getByLabelText('Week')).toHaveValue('1');
  });
});
