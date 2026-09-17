import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ScoreOverrideWizardModal } from '../../../../components/admin';

const target = {
  awayPoints: 21,
  awayTeam: 'Iowa',
  gameID: 401234561,
  homePoints: 24,
  homeTeam: 'Nebraska',
  reason: '',
};

async function advanceToReviewStep(homeScore = '27', reason = 'Targeting was missed on the final play.') {
  await userEvent.clear(screen.getByLabelText('Nebraska Score'));
  await userEvent.type(screen.getByLabelText('Nebraska Score'), homeScore);
  await userEvent.type(screen.getByLabelText('Reason'), reason);
  await userEvent.click(screen.getByRole('button', { name: 'Next' }));
}

describe('ScoreOverrideWizardModal', () => {
  it('calls onCancel when Cancel is clicked on the edit step', async () => {
    const onCancel = vi.fn();
    render(<ScoreOverrideWizardModal isSaving={false} onCancel={onCancel} onConfirm={vi.fn()} target={target} />);

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalled();
  });

  it('calls onCancel on Escape', async () => {
    const onCancel = vi.fn();
    render(<ScoreOverrideWizardModal isSaving={false} onCancel={onCancel} onConfirm={vi.fn()} target={target} />);

    await userEvent.keyboard('{Escape}');

    expect(onCancel).toHaveBeenCalled();
  });

  it('calls onConfirm with the edited scores and trimmed reason once confirmed', async () => {
    const onConfirm = vi.fn();
    render(<ScoreOverrideWizardModal isSaving={false} onCancel={vi.fn()} onConfirm={onConfirm} target={target} />);

    await advanceToReviewStep('27', '  Targeting was missed on the final play.  ');
    await userEvent.click(screen.getByLabelText('I understand this does not retroactively update published results.'));
    await userEvent.type(screen.getByLabelText('Type 21-27 to confirm'), '21-27');
    await userEvent.click(screen.getByRole('button', { name: 'Confirm Override' }));

    expect(onConfirm).toHaveBeenCalledWith(27, 21, 'Targeting was missed on the final play.');
  });

  it('disables Confirm Override until the typed score matches exactly', async () => {
    render(<ScoreOverrideWizardModal isSaving={false} onCancel={vi.fn()} onConfirm={vi.fn()} target={target} />);

    await advanceToReviewStep();
    await userEvent.click(screen.getByLabelText('I understand this does not retroactively update published results.'));
    await userEvent.type(screen.getByLabelText('Type 21-27 to confirm'), '21-24');

    expect(screen.getByRole('button', { name: 'Confirm Override' })).toBeDisabled();
  });

  it('disables Confirm Override until the understanding checkbox is checked', async () => {
    render(<ScoreOverrideWizardModal isSaving={false} onCancel={vi.fn()} onConfirm={vi.fn()} target={target} />);

    await advanceToReviewStep();
    await userEvent.type(screen.getByLabelText('Type 21-27 to confirm'), '21-27');

    expect(screen.getByRole('button', { name: 'Confirm Override' })).toBeDisabled();
  });

  it('disables Next until the reason is non-empty', async () => {
    render(<ScoreOverrideWizardModal isSaving={false} onCancel={vi.fn()} onConfirm={vi.fn()} target={target} />);

    await userEvent.clear(screen.getByLabelText('Nebraska Score'));
    await userEvent.type(screen.getByLabelText('Nebraska Score'), '27');

    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('disables Next until at least one score differs from the original', async () => {
    render(<ScoreOverrideWizardModal isSaving={false} onCancel={vi.fn()} onConfirm={vi.fn()} target={target} />);

    await userEvent.type(screen.getByLabelText('Reason'), 'Targeting was missed on the final play.');

    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('returns to the edit step when Back is clicked', async () => {
    render(<ScoreOverrideWizardModal isSaving={false} onCancel={vi.fn()} onConfirm={vi.fn()} target={target} />);

    await advanceToReviewStep();
    await userEvent.click(screen.getByRole('button', { name: 'Back' }));

    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
  });
});
