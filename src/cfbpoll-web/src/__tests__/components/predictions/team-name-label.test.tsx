import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { TeamNameLabel } from '../../../components/predictions/team-name-label';

describe('TeamNameLabel', () => {
  it('applies the default hover-link classes when no className is provided', () => {
    render(
      <MemoryRouter>
        <TeamNameLabel teamName="Michigan" season={2024} />
      </MemoryRouter>
    );

    expect(screen.getByRole('link')).toHaveClass('hover:text-accent', 'hover:underline');
  });

  it('does not show a rank badge when rank is outside the top 25', () => {
    render(<TeamNameLabel teamName="Michigan" rank={30} />);

    expect(screen.getByText('Michigan').closest('span')?.textContent).toBe('Michigan');
  });

  it('renders as a link to team-details when season is provided', () => {
    render(
      <MemoryRouter>
        <TeamNameLabel teamName="Michigan" season={2024} />
      </MemoryRouter>
    );

    const link = screen.getByRole('link', { name: 'Michigan' });
    expect(link).toHaveAttribute('href', `/team-details?team=${encodeURIComponent('Michigan')}&season=2024`);
  });

  it('renders as plain text when season is omitted', () => {
    render(<TeamNameLabel teamName="Michigan" />);

    expect(screen.getByText('Michigan')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('shows a rank badge when rank is within the top 25', () => {
    render(<TeamNameLabel teamName="Michigan" rank={3} />);

    expect(screen.getByText('Michigan').closest('span')?.textContent).toBe('#3 Michigan');
  });

  it('uses the provided className instead of the default hover-link classes, so a grade pill is not overridden on hover', () => {
    render(
      <MemoryRouter>
        <TeamNameLabel teamName="Michigan" season={2024} className="bg-green-100 text-green-800" />
      </MemoryRouter>
    );

    const link = screen.getByRole('link');
    expect(link).toHaveClass('bg-green-100', 'text-green-800');
    expect(link).not.toHaveClass('hover:text-accent');
    expect(link).not.toHaveClass('hover:underline');
  });
});
