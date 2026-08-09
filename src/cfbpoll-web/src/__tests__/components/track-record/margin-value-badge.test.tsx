import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MarginValueBadge } from '../../../components/track-record/margin-value-badge';

describe('MarginValueBadge', () => {
  it('renders the value as plain text when classes is null', () => {
    render(<MarginValueBadge classes={null} value="8.3 pts" />);

    expect(screen.getByText('8.3 pts')).not.toHaveClass('inline-block');
  });

  it('wraps the value in the given classes when provided', () => {
    render(<MarginValueBadge classes="bg-green-100 text-green-800" value="8.3 pts" />);

    expect(screen.getByText('8.3 pts')).toHaveClass('bg-green-100', 'text-green-800');
  });
});
