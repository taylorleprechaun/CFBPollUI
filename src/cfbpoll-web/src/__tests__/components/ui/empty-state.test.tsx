import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { EmptyState } from '../../../components/ui/empty-state';

describe('EmptyState', () => {
  it('renders message text', () => {
    render(<EmptyState message="No items found." />);

    expect(screen.getByText('No items found.')).toBeInTheDocument();
  });

  it('applies fade-in animation class', () => {
    const { container } = render(<EmptyState message="Empty" />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('animate-fade-in');
  });

  it('renders icon when provided', () => {
    render(
      <EmptyState
        message="Nothing here"
        icon={<svg data-testid="empty-icon" />}
      />
    );

    expect(screen.getByTestId('empty-icon')).toBeInTheDocument();
  });

  it('does not render icon container when icon is not provided', () => {
    const { container } = render(<EmptyState message="No data" />);

    const children = container.firstChild?.childNodes;
    // Only the <p> element, no icon wrapper
    expect(children).toHaveLength(1);
  });

  it('centers content vertically with padding', () => {
    const { container } = render(<EmptyState message="Centered" />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('py-16');
    expect(wrapper).toHaveClass('items-center');
    expect(wrapper).toHaveClass('justify-center');
  });
});
