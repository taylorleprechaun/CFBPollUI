import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { HomePage } from '../../pages/home-page';

class MockIntersectionObserver {
  disconnect = vi.fn();
  observe = vi.fn();
  unobserve = vi.fn();
}

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
});

function renderHomePage() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>
  );
}

describe('HomePage', () => {
  it('has How It Works heading with id for scroll target', () => {
    renderHomePage();

    const heading = screen.getByRole('heading', { name: 'How It Works' });

    expect(heading).toHaveAttribute('id', 'how-it-works');
  });

  it('renders algorithm factors', () => {
    renderHomePage();

    expect(screen.getByText('Win-Loss Record')).toBeInTheDocument();
    expect(screen.getByText('Strength of Schedule')).toBeInTheDocument();
    expect(screen.getByText('Game Statistics')).toBeInTheDocument();
    expect(screen.getByText('Success Rate')).toBeInTheDocument();
  });

  it('renders stat labels', () => {
    renderHomePage();

    expect(screen.getByText('Seasons')).toBeInTheDocument();
    expect(screen.getByText('FBS Teams')).toBeInTheDocument();
    expect(screen.getByText('Data Since')).toBeInTheDocument();
  });

  it('renders the heading', () => {
    renderHomePage();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'College Football Rankings'
    );
  });

  it('renders the Learn More link', () => {
    renderHomePage();

    const link = screen.getByRole('link', { name: /Learn More/i });

    expect(link).toHaveAttribute('href', '#how-it-works');
  });

  it('renders the name intro line', () => {
    renderHomePage();

    expect(screen.getByText('Taylor Steinberg\u2019s')).toBeInTheDocument();
  });

  it('renders the View Rankings link pointing to /rankings', () => {
    renderHomePage();

    const link = screen.getByRole('link', { name: 'View Rankings' });

    expect(link).toHaveAttribute('href', '/rankings');
  });

  it('scrolls to how-it-works section when Learn More is clicked', async () => {
    const user = userEvent.setup();
    renderHomePage();

    const target = document.getElementById('how-it-works')!;
    target.scrollIntoView = vi.fn();

    const link = screen.getByRole('link', { name: /Learn More/i });
    await user.click(link);

    expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  it('sets the document title', () => {
    renderHomePage();

    expect(document.title).toBe('Taylor Steinberg - Home');
  });
});
