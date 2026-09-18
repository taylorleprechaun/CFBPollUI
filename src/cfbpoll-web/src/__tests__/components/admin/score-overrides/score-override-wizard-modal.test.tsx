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

const editTarget = {
  awayPoints: 21,
  awayTeam: 'Iowa',
  gameID: 401234561,
  homePoints: 24,
  homeTeam: 'Nebraska',
  reason: 'A targeting call was missed on the game-deciding play.',
};

async function advanceToReviewStep(homeScore = '27', reason = 'Targeting was missed on the final play.') {
  await userEvent.clear(screen.getByLabelText('Nebraska Score'));
  await userEvent.type(screen.getByLabelText('Nebraska Score'), homeScore);
  await userEvent.type(screen.getByLabelText('Reason'), reason);
  await userEvent.click(screen.getByRole('button', { name: 'Next' }));
}

async function advanceToReviewStepInEditMode(
  reason = 'A muffed punt was ruled a fumble recovery that should have been dead.'
) {
  await userEvent.clear(screen.getByLabelText('Reason'));
  await userEvent.type(screen.getByLabelText('Reason'), reason);
  await userEvent.click(screen.getByRole('button', { name: 'Next' }));
}

describe('ScoreOverrideWizardModal', () => {
  it('calls onCancel when Cancel is clicked on the edit step', async () => {
    const onCancel = vi.fn();
    render(<ScoreOverrideWizardModal isEditing={false} isSaving={false} onCancel={onCancel} onConfirm={vi.fn()} target={target} />);

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalled();
  });

  it('calls onCancel on Escape', async () => {
    const onCancel = vi.fn();
    render(<ScoreOverrideWizardModal isEditing={false} isSaving={false} onCancel={onCancel} onConfirm={vi.fn()} target={target} />);

    await userEvent.keyboard('{Escape}');

    expect(onCancel).toHaveBeenCalled();
  });

  it('calls onConfirm with the edited scores and trimmed reason once confirmed', async () => {
    const onConfirm = vi.fn();
    render(<ScoreOverrideWizardModal isEditing={false} isSaving={false} onCancel={vi.fn()} onConfirm={onConfirm} target={target} />);

    await advanceToReviewStep('27', '  Targeting was missed on the final play.  ');
    await userEvent.click(screen.getByLabelText('I understand this does not retroactively update published results.'));
    await userEvent.type(screen.getByLabelText('Type 21-27 to confirm'), '21-27');
    await userEvent.click(screen.getByRole('button', { name: 'Confirm Override' }));

    expect(onConfirm).toHaveBeenCalledWith(27, 21, 'Targeting was missed on the final play.');
  });

  it('calls onConfirm with the original score and trimmed reason once confirmed in edit mode', async () => {
    const onConfirm = vi.fn();
    render(<ScoreOverrideWizardModal isEditing={true} isSaving={false} onCancel={vi.fn()} onConfirm={onConfirm} target={editTarget} />);

    await advanceToReviewStepInEditMode('  A muffed punt was ruled a fumble recovery that should have been dead.  ');
    await userEvent.click(screen.getByLabelText('I understand this does not retroactively update published results.'));
    await userEvent.click(screen.getByRole('button', { name: 'Confirm Override' }));

    expect(onConfirm).toHaveBeenCalledWith(
      24,
      21,
      'A muffed punt was ruled a fumble recovery that should have been dead.'
    );
  });

  it('disables Confirm Override until the typed score matches exactly', async () => {
    render(<ScoreOverrideWizardModal isEditing={false} isSaving={false} onCancel={vi.fn()} onConfirm={vi.fn()} target={target} />);

    await advanceToReviewStep();
    await userEvent.click(screen.getByLabelText('I understand this does not retroactively update published results.'));
    await userEvent.type(screen.getByLabelText('Type 21-27 to confirm'), '21-24');

    expect(screen.getByRole('button', { name: 'Confirm Override' })).toBeDisabled();
  });

  it('disables Confirm Override until the understanding checkbox is checked', async () => {
    render(<ScoreOverrideWizardModal isEditing={false} isSaving={false} onCancel={vi.fn()} onConfirm={vi.fn()} target={target} />);

    await advanceToReviewStep();
    await userEvent.type(screen.getByLabelText('Type 21-27 to confirm'), '21-27');

    expect(screen.getByRole('button', { name: 'Confirm Override' })).toBeDisabled();
  });

  it('disables Confirm Override until the understanding checkbox is checked in edit mode', async () => {
    render(<ScoreOverrideWizardModal isEditing={true} isSaving={false} onCancel={vi.fn()} onConfirm={vi.fn()} target={editTarget} />);

    await advanceToReviewStepInEditMode();

    expect(screen.getByRole('button', { name: 'Confirm Override' })).toBeDisabled();
  });

  it('disables Next until at least one score differs from the original', async () => {
    render(<ScoreOverrideWizardModal isEditing={false} isSaving={false} onCancel={vi.fn()} onConfirm={vi.fn()} target={target} />);

    await userEvent.type(screen.getByLabelText('Reason'), 'Targeting was missed on the final play.');

    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('disables Next until the reason changes in edit mode', () => {
    render(<ScoreOverrideWizardModal isEditing={true} isSaving={false} onCancel={vi.fn()} onConfirm={vi.fn()} target={editTarget} />);

    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('disables Next until the reason is non-empty', async () => {
    render(<ScoreOverrideWizardModal isEditing={false} isSaving={false} onCancel={vi.fn()} onConfirm={vi.fn()} target={target} />);

    await userEvent.clear(screen.getByLabelText('Nebraska Score'));
    await userEvent.type(screen.getByLabelText('Nebraska Score'), '27');

    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('does not render score inputs or the typed-confirmation field in edit mode', async () => {
    render(<ScoreOverrideWizardModal isEditing={true} isSaving={false} onCancel={vi.fn()} onConfirm={vi.fn()} target={editTarget} />);

    expect(screen.queryByLabelText('Iowa Score')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Nebraska Score')).not.toBeInTheDocument();

    await advanceToReviewStepInEditMode();

    expect(screen.queryByText(/Type .* to confirm/)).not.toBeInTheDocument();
  });

  it('returns to the edit step when Back is clicked', async () => {
    render(<ScoreOverrideWizardModal isEditing={false} isSaving={false} onCancel={vi.fn()} onConfirm={vi.fn()} target={target} />);

    await advanceToReviewStep();
    await userEvent.click(screen.getByRole('button', { name: 'Back' }));

    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
  });
});
