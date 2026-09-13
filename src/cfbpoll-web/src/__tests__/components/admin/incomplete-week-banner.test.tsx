import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { IncompleteWeekBanner } from '../../../components/admin/incomplete-week-banner';

vi.mock('../../../hooks/use-incomplete-games', () => ({
  useIncompleteGames: () => ({ data: undefined, error: undefined, isLoading: true }),
}));

describe('IncompleteWeekBanner', () => {
  const defaultProps = {
    season: 2026,
    token: 'test-token',
    week: 2,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render the modal until the info icon is clicked', () => {
    render(<IncompleteWeekBanner {...defaultProps} variant="ratings" />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the modal when the info icon is clicked', async () => {
    render(<IncompleteWeekBanner {...defaultProps} variant="ratings" />);

    await userEvent.click(screen.getByRole('button', { name: 'Show which games are incomplete' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renders the predictions warning message for the predictions variant', () => {
    render(<IncompleteWeekBanner {...defaultProps} variant="predictions" />);

    expect(screen.getByText(/predictions generated now would be based on incomplete data/)).toBeInTheDocument();
  });

  it('renders the ratings warning message for the ratings variant', () => {
    render(<IncompleteWeekBanner {...defaultProps} variant="ratings" />);

    expect(screen.getByText(/ratings for this week are not ready to calculate/)).toBeInTheDocument();
  });
});
