import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { GameOverridesSection } from '../../../../components/admin';

const mockOverride = {
  awayTeam: 'Texas',
  createdAt: '2025-09-20T00:00:00Z',
  gameID: 401234562,
  homeTeam: 'Oklahoma',
  modifiedAt: '2025-09-20T00:00:00Z',
  originalAwayPoints: 20,
  originalHomePoints: 24,
  overrideAwayPoints: 24,
  overrideHomePoints: 20,
  reason: 'A targeting call was missed on the game-deciding play.',
  season: 2025,
  seasonType: 'regular',
  week: 3,
};

describe('GameOverridesSection', () => {
  it('calls onDelete with the clicked override', async () => {
    const onDelete = vi.fn();
    render(<GameOverridesSection isDeleting={false} isLoading={false} onDelete={onDelete} onEdit={vi.fn()} overrides={[mockOverride]} />);

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(onDelete).toHaveBeenCalledWith(mockOverride);
  });

  it('calls onEdit with the clicked override', async () => {
    const onEdit = vi.fn();
    render(<GameOverridesSection isDeleting={false} isLoading={false} onDelete={vi.fn()} onEdit={onEdit} overrides={[mockOverride]} />);

    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));

    expect(onEdit).toHaveBeenCalledWith(mockOverride);
  });

  it('disables the delete button while deleting', () => {
    render(<GameOverridesSection isDeleting={true} isLoading={false} onDelete={vi.fn()} onEdit={vi.fn()} overrides={[mockOverride]} />);

    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
  });

  it('renders a skeleton while loading', () => {
    render(<GameOverridesSection isDeleting={false} isLoading={true} onDelete={vi.fn()} onEdit={vi.fn()} overrides={[mockOverride]} />);

    expect(screen.queryByText('Texas @ Oklahoma')).not.toBeInTheDocument();
  });

  it('renders an empty state when there are no overrides', () => {
    render(<GameOverridesSection isDeleting={false} isLoading={false} onDelete={vi.fn()} onEdit={vi.fn()} overrides={[]} />);

    expect(screen.getByText('No manual score overrides for this season.')).toBeInTheDocument();
  });

  it('renders the matchup, original score, and override score', () => {
    render(<GameOverridesSection isDeleting={false} isLoading={false} onDelete={vi.fn()} onEdit={vi.fn()} overrides={[mockOverride]} />);

    expect(screen.getByText('Texas @ Oklahoma')).toBeInTheDocument();
    expect(screen.getByText('20 - 24')).toBeInTheDocument();
    expect(screen.getByText('24 - 20')).toBeInTheDocument();
  });
});
