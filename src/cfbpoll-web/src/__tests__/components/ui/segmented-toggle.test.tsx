import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SegmentedToggle } from '../../../components/ui/segmented-toggle';

const options = [
  { label: 'First', value: 'first' },
  { label: 'Second', value: 'second' },
] as const;

describe('SegmentedToggle', () => {
  it('labels the group for assistive technology', () => {
    render(<SegmentedToggle ariaLabel="Pick one" onChange={vi.fn()} options={options} value="first" />);

    expect(screen.getByRole('group', { name: 'Pick one' })).toBeInTheDocument();
  });

  it('marks only the selected option as pressed', () => {
    render(<SegmentedToggle ariaLabel="Pick one" onChange={vi.fn()} options={options} value="second" />);

    expect(screen.getByRole('button', { name: 'First' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Second' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('reports the option that was clicked', async () => {
    const onChange = vi.fn();
    render(<SegmentedToggle ariaLabel="Pick one" onChange={onChange} options={options} value="first" />);

    await userEvent.click(screen.getByRole('button', { name: 'Second' }));

    expect(onChange).toHaveBeenCalledWith('second');
  });

  it('uses the smaller text size when asked', () => {
    render(<SegmentedToggle ariaLabel="Pick one" onChange={vi.fn()} options={options} size="sm" value="first" />);

    expect(screen.getByRole('button', { name: 'First' })).toHaveClass('text-xs');
  });
});
