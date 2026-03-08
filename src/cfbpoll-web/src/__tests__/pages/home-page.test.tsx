import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from '../../pages/home-page';

function renderHomePage() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>
  );
}

describe('HomePage', () => {
  it('sets the document title', () => {
    renderHomePage();

    expect(document.title).toBe('Taylor Steinberg - Home');
  });

  it('renders the name intro line', () => {
    renderHomePage();

    expect(screen.getByText('Taylor Steinberg\u2019s')).toBeInTheDocument();
  });

  it('renders the heading', () => {
    renderHomePage();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'College Football Rankings'
    );
  });

  it('renders algorithm factors', () => {
    renderHomePage();

    expect(screen.getByText('Win-Loss Record')).toBeInTheDocument();
    expect(screen.getByText('Strength of Schedule')).toBeInTheDocument();
    expect(screen.getByText('Game Statistics')).toBeInTheDocument();
    expect(screen.getByText('Success Rate')).toBeInTheDocument();
  });

  it('renders the View Rankings link pointing to /rankings', () => {
    renderHomePage();

    var link = screen.getByRole('link', { name: 'View Rankings' });

    expect(link).toHaveAttribute('href', '/rankings');
  });

});
