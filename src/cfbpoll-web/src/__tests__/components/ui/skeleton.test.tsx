import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';

import { Skeleton } from '../../../components/ui/skeleton';

describe('Skeleton', () => {
  it('renders with animate-pulse class', () => {
    const { container } = render(<Skeleton />);

    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('animate-pulse');
    expect(skeleton).toHaveClass('rounded');
    expect(skeleton).toHaveClass('bg-surface-alt');
  });

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="h-4 w-16" />);

    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('h-4');
    expect(skeleton).toHaveClass('w-16');
    expect(skeleton).toHaveClass('animate-pulse');
  });

  it('renders as a div element', () => {
    const { container } = render(<Skeleton />);

    expect(container.firstChild?.nodeName).toBe('DIV');
  });
});
