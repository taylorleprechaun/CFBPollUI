import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CompareSeasonWeeksModal } from '../../../components/admin/compare-season-weeks-modal';

describe('CompareSeasonWeeksModal', () => {
  const weeks = [
    { label: 'Week 5', predictionsPublished: true, rankingsPublished: true, weekNumber: 5 },
    { label: 'Week 6', predictionsPublished: true, rankingsPublished: true, weekNumber: 6 },
    { label: 'Postseason', predictionsPublished: false, rankingsPublished: false, weekNumber: 17 },
  ];

  const defaultProps = {
    onCancel: vi.fn(),
    onConfirm: vi.fn(),
    season: 2024,
    weeks,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls onCancel when backdrop is clicked', async () => {
    render(<CompareSeasonWeeksModal {...defaultProps} />);

    await userEvent.click(screen.getByRole('dialog'));

    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    render(<CompareSeasonWeeksModal {...defaultProps} />);

    await userEvent.click(screen.getByText('Cancel'));

    expect(defaultProps.onCancel).toHaveBeenCalledOnce();
  });

  it('calls onCancel when Escape key is pressed', () => {
    render(<CompareSeasonWeeksModal {...defaultProps} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(defaultProps.onCancel).toHaveBeenCalledOnce();
  });

  it('calls onConfirm with all weeks when confirmed without changes', async () => {
    render(<CompareSeasonWeeksModal {...defaultProps} />);

    await userEvent.click(screen.getByText('Compare'));

    expect(defaultProps.onConfirm).toHaveBeenCalledWith([5, 6, 17]);
  });

  it('calls onConfirm with only the checked weeks after unchecking one', async () => {
    render(<CompareSeasonWeeksModal {...defaultProps} />);

    await userEvent.click(screen.getByLabelText('Postseason'));
    await userEvent.click(screen.getByText('Compare'));

    expect(defaultProps.onConfirm).toHaveBeenCalledWith([5, 6]);
  });

  it('defaults every week checkbox to checked', () => {
    render(<CompareSeasonWeeksModal {...defaultProps} />);

    for (const week of weeks) {
      expect(screen.getByLabelText(week.label)).toBeChecked();
    }
  });

  it('disables the Compare button when Deselect All is clicked', async () => {
    render(<CompareSeasonWeeksModal {...defaultProps} />);

    await userEvent.click(screen.getByText('Deselect All'));

    expect(screen.getByText('Compare')).toBeDisabled();
  });

  it('does not call onCancel when modal content is clicked', async () => {
    render(<CompareSeasonWeeksModal {...defaultProps} />);

    await userEvent.click(screen.getByText(`Compare Season ${defaultProps.season}`));

    expect(defaultProps.onCancel).not.toHaveBeenCalled();
  });

  it('focuses the first focusable element on mount', () => {
    render(<CompareSeasonWeeksModal {...defaultProps} />);

    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'About Week scheduling gap' }));
  });

  it('has correct aria attributes', () => {
    render(<CompareSeasonWeeksModal {...defaultProps} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'compare-season-weeks-title');
  });

  it('leaves focus unchanged when Shift+Tab is pressed on a non-boundary element', () => {
    render(<CompareSeasonWeeksModal {...defaultProps} />);

    const middleCheckbox = screen.getByLabelText('Week 6');
    middleCheckbox.focus();

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });

    expect(document.activeElement).toBe(middleCheckbox);
  });

  it('leaves focus unchanged when Tab is pressed on a non-boundary element', () => {
    render(<CompareSeasonWeeksModal {...defaultProps} />);

    const middleCheckbox = screen.getByLabelText('Week 6');
    middleCheckbox.focus();

    fireEvent.keyDown(document, { key: 'Tab' });

    expect(document.activeElement).toBe(middleCheckbox);
  });

  it('re-checks a week after Select All following an individual uncheck', async () => {
    render(<CompareSeasonWeeksModal {...defaultProps} />);

    await userEvent.click(screen.getByLabelText('Week 5'));
    await userEvent.click(screen.getByText('Select All'));

    expect(screen.getByLabelText('Week 5')).toBeChecked();
  });

  it('re-checks an individually unchecked week when its own checkbox is clicked again', async () => {
    render(<CompareSeasonWeeksModal {...defaultProps} />);

    await userEvent.click(screen.getByLabelText('Week 5'));
    await userEvent.click(screen.getByLabelText('Week 5'));

    expect(screen.getByLabelText('Week 5')).toBeChecked();
  });

  it('restores focus to the previously focused element on unmount', () => {
    const externalButton = document.createElement('button');
    externalButton.textContent = 'External';
    document.body.appendChild(externalButton);
    externalButton.focus();

    const { unmount } = render(<CompareSeasonWeeksModal {...defaultProps} />);
    unmount();

    expect(document.activeElement).toBe(externalButton);

    document.body.removeChild(externalButton);
  });

  it('traps focus backward from the first element to the last on Shift+Tab', () => {
    render(<CompareSeasonWeeksModal {...defaultProps} />);

    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'About Week scheduling gap' }));

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });

    expect(document.activeElement).toBe(screen.getByText('Compare'));
  });

  it('traps focus forward from the last element to the first on Tab', () => {
    render(<CompareSeasonWeeksModal {...defaultProps} />);

    screen.getByText('Compare').focus();

    fireEvent.keyDown(document, { key: 'Tab' });

    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'About Week scheduling gap' }));
  });

  it('unchecks all week checkboxes when Deselect All is clicked', async () => {
    render(<CompareSeasonWeeksModal {...defaultProps} />);

    await userEvent.click(screen.getByText('Deselect All'));

    for (const week of weeks) {
      expect(screen.getByLabelText(week.label)).not.toBeChecked();
    }
  });
});
