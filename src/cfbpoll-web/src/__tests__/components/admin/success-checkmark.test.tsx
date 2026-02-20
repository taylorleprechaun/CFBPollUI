import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SuccessCheckmark } from '../../../components/admin';

describe('SuccessCheckmark', () => {
  it('renders checkmark SVG', () => {
    render(<SuccessCheckmark onDone={vi.fn()} />);

    expect(screen.getByLabelText('Success')).toBeInTheDocument();
  });

  it('calls onDone after timeout', async () => {
    const onDone = vi.fn();
    render(<SuccessCheckmark onDone={onDone} />);

    expect(onDone).not.toHaveBeenCalled();

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1), { timeout: 3000 });
  });

  it('cleans up timer on unmount', () => {
    const onDone = vi.fn();
    const { unmount } = render(<SuccessCheckmark onDone={onDone} />);

    unmount();

    expect(onDone).not.toHaveBeenCalled();
  });
});
