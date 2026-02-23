import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Layout } from '../../components/layout/layout';

let mockIsAuthenticated = false;
let mockAllTimeEnabled = true;
let mockPollLeadersEnabled = true;

vi.mock('../../contexts/auth-context', () => ({
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
    login: vi.fn(),
    logout: vi.fn(),
    token: mockIsAuthenticated ? 'test-token' : null,
  }),
}));

vi.mock('../../hooks/use-page-visibility', () => ({
  usePageVisibility: () => ({
    allTimeEnabled: mockAllTimeEnabled,
    isLoading: false,
    pollLeadersEnabled: mockPollLeadersEnabled,
  }),
}));

function renderLayout() {
  return render(
    <MemoryRouter>
      <Layout />
    </MemoryRouter>
  );
}

describe('Layout', () => {
  it('renders navigation links', () => {
    renderLayout();

    expect(screen.getByText('CFB Poll')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Rankings')).toBeInTheDocument();
    expect(screen.getByText('All-Time')).toBeInTheDocument();
    expect(screen.getByText('Team Details')).toBeInTheDocument();
  });

  it('renders All-Time nav link with correct href', () => {
    renderLayout();

    const allTimeLink = screen.getByText('All-Time');
    expect(allTimeLink).toHaveAttribute('href', '/all-time');
  });

  it('hides All-Time link when allTimeEnabled is false', () => {
    mockAllTimeEnabled = false;
    mockPollLeadersEnabled = true;
    renderLayout();

    expect(screen.queryByText('All-Time')).not.toBeInTheDocument();
  });

  it('hides Leaders link when pollLeadersEnabled is false', () => {
    mockAllTimeEnabled = true;
    mockPollLeadersEnabled = false;
    renderLayout();

    expect(screen.queryByText('Leaders')).not.toBeInTheDocument();
  });

  it('shows Leaders link when pollLeadersEnabled is true', () => {
    mockAllTimeEnabled = true;
    mockPollLeadersEnabled = true;
    renderLayout();

    const leadersLink = screen.getByText('Leaders');
    expect(leadersLink).toHaveAttribute('href', '/poll-leaders');
  });

  it('shows lock icon linking to login when not authenticated', () => {
    mockIsAuthenticated = false;
    renderLayout();

    const lockLink = screen.getByLabelText('Admin login');
    expect(lockLink).toBeInTheDocument();
    expect(lockLink).toHaveAttribute('href', '/login');
  });

  it('shows unlock icon linking to admin when authenticated', () => {
    mockIsAuthenticated = true;
    renderLayout();

    const unlockLink = screen.getByLabelText('Admin dashboard');
    expect(unlockLink).toBeInTheDocument();
    expect(unlockLink).toHaveAttribute('href', '/admin');
  });
});
