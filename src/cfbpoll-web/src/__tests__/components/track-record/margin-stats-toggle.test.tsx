import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MarginStatsToggle } from '../../../components/track-record/margin-stats-toggle';

describe('MarginStatsToggle', () => {
  it('calls onToggle when clicked', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<MarginStatsToggle isVisible={false} onToggle={onToggle} />);

    await user.click(screen.getByRole('switch'));

    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('renders the "Advanced stats" label', () => {
    render(<MarginStatsToggle isVisible={false} onToggle={vi.fn()} />);

    expect(screen.getByText('Advanced stats')).toBeInTheDocument();
  });

  it('reports aria-checked as false when hidden', () => {
    render(<MarginStatsToggle isVisible={false} onToggle={vi.fn()} />);

    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });

  it('reports aria-checked as true when visible', () => {
    render(<MarginStatsToggle isVisible={true} onToggle={vi.fn()} />);

    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });
});
