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

  it('renders the heading', () => {
    renderHomePage();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      "Taylor Steinberg's FBS Ratings"
    );
  });

  it('renders algorithm factors', () => {
    renderHomePage();

    expect(screen.getByText('Win-loss record')).toBeInTheDocument();
    expect(screen.getByText('Weighted strength of schedule (SOS)')).toBeInTheDocument();
    expect(screen.getByText('Game statistics')).toBeInTheDocument();
    expect(screen.getByText('Success Rate')).toBeInTheDocument();
  });

  it('renders the View Rankings link pointing to /rankings', () => {
    renderHomePage();

    var link = screen.getByRole('link', { name: 'View Rankings' });

    expect(link).toHaveAttribute('href', '/rankings');
  });

  it('renders the GitHub link', () => {
    renderHomePage();

    var link = screen.getByRole('link', { name: 'GitHub' });

    expect(link).toHaveAttribute('href', 'https://github.com/taylorleprechaun');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders the LinkedIn link', () => {
    renderHomePage();

    var link = screen.getByRole('link', { name: 'LinkedIn' });

    expect(link).toHaveAttribute('href', 'https://www.linkedin.com/in/taylor-steinberg-a86994111/');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders the Twitter link', () => {
    renderHomePage();

    var link = screen.getByRole('link', { name: 'Twitter' });

    expect(link).toHaveAttribute('href', 'https://twitter.com/TaylorLeprechau');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
