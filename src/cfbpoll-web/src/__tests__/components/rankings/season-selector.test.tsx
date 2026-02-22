import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SeasonSelector } from '../../../components/rankings/season-selector';

describe('SeasonSelector', () => {
  const defaultProps = {
    seasons: [2024, 2023, 2022],
    selectedSeason: 2024,
    onSeasonChange: vi.fn(),
    isLoading: false,
  };

  it('renders season options', () => {
    render(<SeasonSelector {...defaultProps} />);

    expect(screen.getByLabelText('Season:')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '2024' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '2023' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '2022' })).toBeInTheDocument();
  });

  it('calls onSeasonChange when a season is selected', async () => {
    render(<SeasonSelector {...defaultProps} />);

    await userEvent.selectOptions(screen.getByLabelText('Season:'), '2023');

    expect(defaultProps.onSeasonChange).toHaveBeenCalledWith(2023);
  });

  it('shows loading option and disables select when isLoading is true', () => {
    render(<SeasonSelector {...defaultProps} isLoading={true} seasons={[]} />);

    const select = screen.getByLabelText('Season:');
    expect(select).toBeDisabled();
    expect(screen.getByRole('option', { name: 'Loading...' })).toBeInTheDocument();
  });

  it('renders without error when selectedSeason is null', () => {
    render(<SeasonSelector {...defaultProps} selectedSeason={null} seasons={[]} />);

    const select = screen.getByLabelText('Season:') as HTMLSelectElement;
    expect(select.value).toBe('');
  });
});
