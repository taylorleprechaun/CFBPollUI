import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ValueBadge } from '../../../components/ui/value-badge';

describe('ValueBadge', () => {
  it('renders the value as plain text when classes is null', () => {
    render(<ValueBadge classes={null} value="8.3 pts" />);

    expect(screen.getByText('8.3 pts')).not.toHaveClass('inline-block');
  });

  it('wraps the value in the given classes when provided', () => {
    render(<ValueBadge classes="bg-green-100 text-green-800" value="8.3 pts" />);

    expect(screen.getByText('8.3 pts')).toHaveClass('bg-green-100', 'text-green-800');
  });
});
