import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StatusBadge } from '../../../components/ui/status-badge';

describe('StatusBadge', () => {
  it('applies the base pill styling', () => {
    render(<StatusBadge className="bg-green-100 text-green-800" label="Published" />);

    const badge = screen.getByText('Published');
    expect(badge.className).toContain('rounded-full');
  });

  it('applies the provided className', () => {
    render(<StatusBadge className="bg-green-100 text-green-800" label="Published" />);

    const badge = screen.getByText('Published');
    expect(badge.className).toContain('bg-green-100');
    expect(badge.className).toContain('text-green-800');
  });

  it('renders the label text', () => {
    render(<StatusBadge className="bg-green-100 text-green-800" label="Published" />);

    expect(screen.getByText('Published')).toBeInTheDocument();
  });
});
