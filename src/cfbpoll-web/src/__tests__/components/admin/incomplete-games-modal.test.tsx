import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { IncompleteGamesModal } from '../../../components/admin/incomplete-games-modal';

let mockData: unknown = undefined;
let mockError: unknown = undefined;
let mockIsLoading = false;

vi.mock('../../../hooks/use-incomplete-games', () => ({
  useIncompleteGames: () => ({
    data: mockData,
    error: mockError,
    isLoading: mockIsLoading,
  }),
}));

describe('IncompleteGamesModal', () => {
  const defaultProps = {
    onClose: vi.fn(),
    season: 2026,
    token: 'test-token',
    week: 2,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockData = undefined;
    mockError = undefined;
    mockIsLoading = false;
  });

  it('calls onClose when backdrop is clicked', async () => {
    render(<IncompleteGamesModal {...defaultProps} />);

    await userEvent.click(screen.getByRole('dialog'));

    expect(defaultProps.onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when Escape key is pressed', () => {
    render(<IncompleteGamesModal {...defaultProps} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(defaultProps.onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when the Close button is clicked', async () => {
    render(<IncompleteGamesModal {...defaultProps} />);

    await userEvent.click(screen.getByText('Close'));

    expect(defaultProps.onClose).toHaveBeenCalledOnce();
  });

  it('does not call onClose when modal content is clicked', async () => {
    render(<IncompleteGamesModal {...defaultProps} />);

    await userEvent.click(screen.getByText('2026 Week 3 - Incomplete Games'));

    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('has correct aria attributes', () => {
    render(<IncompleteGamesModal {...defaultProps} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'incomplete-games-modal-title');
  });

  it('renders a message when there are no incomplete games', () => {
    mockData = { games: [], season: 2026, week: 2 };
    render(<IncompleteGamesModal {...defaultProps} />);

    expect(screen.getByText('No incomplete games found for this week.')).toBeInTheDocument();
  });

  it('renders an error message when the fetch fails', () => {
    mockError = new Error('Network error');
    render(<IncompleteGamesModal {...defaultProps} />);

    expect(screen.getByText('Failed to load incomplete games.')).toBeInTheDocument();
  });

  it('renders "Date TBD" when a game has no start date', () => {
    mockData = {
      games: [{ awayTeam: 'Nebraska', homeTeam: 'Iowa', startDate: null, startTimeTbd: false }],
      season: 2026,
      week: 2,
    };
    render(<IncompleteGamesModal {...defaultProps} />);

    expect(screen.getByText('Date TBD')).toBeInTheDocument();
  });

  it('renders game matchups and formatted kickoff time', () => {
    mockData = {
      games: [
        { awayTeam: 'Texas', homeTeam: 'Oklahoma', startDate: '2026-09-12T18:00:00.000Z', startTimeTbd: false },
      ],
      season: 2026,
      week: 2,
    };
    render(<IncompleteGamesModal {...defaultProps} />);

    expect(screen.getByText('Texas @ Oklahoma')).toBeInTheDocument();
  });

  it('shows a loading state while fetching', () => {
    mockIsLoading = true;
    const { container } = render(<IncompleteGamesModal {...defaultProps} />);

    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });
});
