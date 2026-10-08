import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConfirmModal } from '../../../components/ui/confirm-modal';

describe('ConfirmModal', () => {
  const defaultProps = {
    title: 'Confirm Delete',
    message: 'Are you sure you want to delete this item?',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls onCancel when backdrop is clicked', async () => {
    render(<ConfirmModal {...defaultProps} />);

    await userEvent.click(screen.getByRole('dialog').closest('div')!);

    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    render(<ConfirmModal {...defaultProps} />);

    await userEvent.click(screen.getByText('Cancel'));

    expect(defaultProps.onCancel).toHaveBeenCalledOnce();
  });

  it('calls onCancel when Escape key is pressed', () => {
    render(<ConfirmModal {...defaultProps} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(defaultProps.onCancel).toHaveBeenCalledOnce();
  });

  it('calls onConfirm when delete button is clicked', async () => {
    render(<ConfirmModal {...defaultProps} />);

    await userEvent.click(screen.getByText('Delete'));

    expect(defaultProps.onConfirm).toHaveBeenCalledOnce();
  });

  it('does not call onCancel when modal content is clicked', async () => {
    render(<ConfirmModal {...defaultProps} />);

    await userEvent.click(screen.getByText('Confirm Delete'));

    expect(defaultProps.onCancel).not.toHaveBeenCalled();
  });

  it('focuses cancel button on mount', () => {
    render(<ConfirmModal {...defaultProps} />);

    expect(document.activeElement).toBe(screen.getByText('Cancel'));
  });

  it('has correct aria attributes', () => {
    render(<ConfirmModal {...defaultProps} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'confirm-modal-title');
  });

  it('renders cancel and delete buttons', () => {
    render(<ConfirmModal {...defaultProps} />);

    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('renders custom confirm label', () => {
    render(<ConfirmModal {...defaultProps} confirmLabel="Remove" />);

    expect(screen.getByText('Remove')).toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('renders title and message', () => {
    render(<ConfirmModal {...defaultProps} />);

    expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this item?')).toBeInTheDocument();
  });

  it('restores focus to previously focused element on unmount', () => {
    const externalButton = document.createElement('button');
    externalButton.textContent = 'External';
    document.body.appendChild(externalButton);
    externalButton.focus();

    const { unmount } = render(<ConfirmModal {...defaultProps} />);

    expect(document.activeElement).toBe(screen.getByText('Cancel'));

    unmount();

    expect(document.activeElement).toBe(externalButton);

    document.body.removeChild(externalButton);
  });

  it('traps focus backward from Cancel to Delete on Shift+Tab', () => {
    render(<ConfirmModal {...defaultProps} />);

    expect(document.activeElement).toBe(screen.getByText('Cancel'));

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });

    expect(document.activeElement).toBe(screen.getByText('Delete'));
  });

  it('traps focus backward from Delete to Cancel on Shift+Tab', () => {
    render(<ConfirmModal {...defaultProps} />);

    const deleteButton = screen.getByText('Delete');
    deleteButton.focus();

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });

    expect(document.activeElement).toBe(screen.getByText('Cancel'));
  });

  it('traps focus forward from Cancel to Delete on Tab', () => {
    render(<ConfirmModal {...defaultProps} />);

    expect(document.activeElement).toBe(screen.getByText('Cancel'));

    fireEvent.keyDown(document, { key: 'Tab' });

    expect(document.activeElement).toBe(screen.getByText('Delete'));
  });

  it('traps focus forward from Delete to Cancel on Tab', () => {
    render(<ConfirmModal {...defaultProps} />);

    const deleteButton = screen.getByText('Delete');
    deleteButton.focus();

    fireEvent.keyDown(document, { key: 'Tab' });

    expect(document.activeElement).toBe(screen.getByText('Cancel'));
  });
  describe('with confirmPhrase', () => {
    const phraseProps = { ...defaultProps, confirmPhrase: '2026 Week 7' };

    it('calls onConfirm when Enter is pressed after typing the phrase', async () => {
      render(<ConfirmModal {...phraseProps} />);

      await userEvent.type(screen.getByLabelText(/to confirm/), '2026 Week 7{Enter}');

      expect(defaultProps.onConfirm).toHaveBeenCalledOnce();
    });

    it('disables the confirm button until the phrase is typed', async () => {
      render(<ConfirmModal {...phraseProps} />);

      expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();

      await userEvent.type(screen.getByLabelText(/to confirm/), '2026 Week 7');

      expect(screen.getByRole('button', { name: 'Delete' })).toBeEnabled();
    });

    it('does not call onConfirm when Enter is pressed before the phrase matches', async () => {
      render(<ConfirmModal {...phraseProps} />);

      await userEvent.type(screen.getByLabelText(/to confirm/), '2026 Week 6{Enter}');

      expect(defaultProps.onConfirm).not.toHaveBeenCalled();
    });

    it('enables the confirm button when the typed phrase has surrounding whitespace', async () => {
      render(<ConfirmModal {...phraseProps} />);

      await userEvent.type(screen.getByLabelText(/to confirm/), '  2026 Week 7  ');

      expect(screen.getByRole('button', { name: 'Delete' })).toBeEnabled();
    });

    it('focuses the phrase input on mount', () => {
      render(<ConfirmModal {...phraseProps} />);

      expect(document.activeElement).toBe(screen.getByLabelText(/to confirm/));
    });

    it('keeps the confirm button disabled for a partial phrase', async () => {
      render(<ConfirmModal {...phraseProps} />);

      await userEvent.type(screen.getByLabelText(/to confirm/), '2026 Week');

      expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
    });

    it('shows the phrase to type', () => {
      render(<ConfirmModal {...phraseProps} />);

      expect(screen.getByText('2026 Week 7')).toBeInTheDocument();
    });

    it('skips the disabled confirm button when trapping focus', () => {
      render(<ConfirmModal {...phraseProps} />);

      fireEvent.keyDown(document, { key: 'Tab' });
      expect(document.activeElement).toBe(screen.getByText('Cancel'));

      fireEvent.keyDown(document, { key: 'Tab' });
      expect(document.activeElement).toBe(screen.getByLabelText(/to confirm/));
    });

    it('traps focus across the phrase input, Cancel, and the enabled confirm button on Tab', async () => {
      render(<ConfirmModal {...phraseProps} />);
      const input = screen.getByLabelText(/to confirm/);
      await userEvent.type(input, '2026 Week 7');

      fireEvent.keyDown(document, { key: 'Tab' });
      expect(document.activeElement).toBe(screen.getByText('Cancel'));

      fireEvent.keyDown(document, { key: 'Tab' });
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Delete' }));

      fireEvent.keyDown(document, { key: 'Tab' });
      expect(document.activeElement).toBe(input);
    });
  });
});
