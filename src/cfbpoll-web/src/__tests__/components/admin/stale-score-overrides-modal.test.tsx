import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { StaleScoreOverride } from '../../../schemas/admin';

import { StaleScoreOverridesModal } from '../../../components/admin/stale-score-overrides-modal';

const differences: StaleScoreOverride[] = [
  { awayTeam: 'Iowa', gameID: 401234561, homeTeam: 'Nebraska', kind: 'Added' },
  { awayTeam: 'Texas', gameID: 401234562, homeTeam: 'Oklahoma', kind: 'Removed' },
  { awayTeam: 'USC', gameID: 401234563, homeTeam: 'Florida', kind: 'Changed' },
];

function renderModal(props: Partial<{ isPublished: boolean; onClose: () => void }> = {}) {
  return render(
    <StaleScoreOverridesModal
      differences={differences}
      isPublished={props.isPublished ?? false}
      onClose={props.onClose ?? vi.fn()}
      season={2025}
      week={6}
    />
  );
}

describe('StaleScoreOverridesModal', () => {
  it('calls onClose on Escape', async () => {
    const onClose = vi.fn();
    renderModal({ onClose });

    await userEvent.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Close is clicked', async () => {
    const onClose = vi.fn();
    renderModal({ onClose });

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('lists each game with how its override differs', () => {
    renderModal();

    expect(screen.getByText('Iowa @ Nebraska')).toBeInTheDocument();
    expect(screen.getByText('Added since calculation')).toBeInTheDocument();
    expect(screen.getByText('Texas @ Oklahoma')).toBeInTheDocument();
    expect(screen.getByText('Removed since calculation')).toBeInTheDocument();
    expect(screen.getByText('USC @ Florida')).toBeInTheDocument();
    expect(screen.getByText('Score changed since calculation')).toBeInTheDocument();
  });

  it('tells the admin to recalculate before publishing a draft', () => {
    renderModal({ isPublished: false });

    expect(screen.getByText(/Recalculate it so the numbers reflect them before publishing/)).toBeInTheDocument();
    expect(screen.getByText(/\(draft\)/)).toBeInTheDocument();
  });

  it('explains that a published week is expected to predate later override changes', () => {
    renderModal({ isPublished: true });

    expect(screen.getByText(/That is expected for a published week/)).toBeInTheDocument();
    expect(screen.getByText(/\(published\)/)).toBeInTheDocument();
  });
});
