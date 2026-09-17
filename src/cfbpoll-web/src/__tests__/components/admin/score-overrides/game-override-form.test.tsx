import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { GameOverrideForm } from '../../../../components/admin';

const target = {
  awayPoints: 21,
  awayTeam: 'Iowa',
  gameID: 401234561,
  homePoints: 24,
  homeTeam: 'Nebraska',
  reason: '',
};

describe('GameOverrideForm', () => {
  it('calls onCancel when Cancel is clicked', async () => {
    const onCancel = vi.fn();
    render(<GameOverrideForm isSaving={false} onCancel={onCancel} onSave={vi.fn()} target={target} />);

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalled();
  });

  it('calls onSave with the edited scores and trimmed reason', async () => {
    const onSave = vi.fn();
    render(<GameOverrideForm isSaving={false} onCancel={vi.fn()} onSave={onSave} target={target} />);

    await userEvent.clear(screen.getByLabelText('Iowa Score'));
    await userEvent.type(screen.getByLabelText('Iowa Score'), '17');
    await userEvent.type(screen.getByLabelText('Reason'), '  Targeting was missed on the final play.  ');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledWith(24, 17, 'Targeting was missed on the final play.');
  });

  it('disables Save while a reason has not been entered', () => {
    render(<GameOverrideForm isSaving={false} onCancel={vi.fn()} onSave={vi.fn()} target={target} />);

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('disables Save while saving is in progress', () => {
    render(<GameOverrideForm isSaving={true} onCancel={vi.fn()} onSave={vi.fn()} target={{ ...target, reason: 'Reason' }} />);

    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();
  });

  it('pre-fills the score inputs and reason from the target', () => {
    render(<GameOverrideForm isSaving={false} onCancel={vi.fn()} onSave={vi.fn()} target={{ ...target, reason: 'Existing reason' }} />);

    expect(screen.getByLabelText('Iowa Score')).toHaveValue(21);
    expect(screen.getByLabelText('Nebraska Score')).toHaveValue(24);
    expect(screen.getByLabelText('Reason')).toHaveValue('Existing reason');
  });
});
