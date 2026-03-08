import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Layout } from '../../components/layout/layout';
import { ThemeProvider } from '../../contexts/theme-context';

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
    <ThemeProvider>
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    </ThemeProvider>
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

  it('renders hamburger menu button', () => {
    renderLayout();

    const menuButton = screen.getByLabelText('Open menu');
    expect(menuButton).toBeInTheDocument();
  });

  it('opens mobile menu when hamburger button is clicked', async () => {
    mockAllTimeEnabled = true;
    mockPollLeadersEnabled = true;
    const user = userEvent.setup();
    renderLayout();

    await user.click(screen.getByLabelText('Open menu'));

    expect(screen.getByLabelText('Close menu')).toBeInTheDocument();
    const homeLinks = screen.getAllByText('Home');
    expect(homeLinks).toHaveLength(2);
  });

  it('closes mobile menu when close button is clicked', async () => {
    const user = userEvent.setup();
    renderLayout();

    await user.click(screen.getByLabelText('Open menu'));
    expect(screen.getByLabelText('Close menu')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Close menu'));
    expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
    expect(screen.getAllByText('Home')).toHaveLength(1);
  });

  it('shows conditional links in mobile menu', async () => {
    mockAllTimeEnabled = true;
    mockPollLeadersEnabled = true;
    const user = userEvent.setup();
    renderLayout();

    await user.click(screen.getByLabelText('Open menu'));

    expect(screen.getAllByText('All-Time')).toHaveLength(2);
    expect(screen.getAllByText('Leaders')).toHaveLength(2);
  });

  it('hides conditional links in mobile menu when disabled', async () => {
    mockAllTimeEnabled = false;
    mockPollLeadersEnabled = false;
    const user = userEvent.setup();
    renderLayout();

    await user.click(screen.getByLabelText('Open menu'));

    expect(screen.queryByText('All-Time')).not.toBeInTheDocument();
    expect(screen.queryByText('Leaders')).not.toBeInTheDocument();
  });

  it('renders footer with name and social links', () => {
    renderLayout();

    expect(screen.getByText('Taylor Steinberg')).toBeInTheDocument();
    expect(screen.getByLabelText('GitHub')).toHaveAttribute('href', 'https://github.com/taylorleprechaun');
    expect(screen.getByLabelText('LinkedIn')).toHaveAttribute('href', 'https://www.linkedin.com/in/taylor-steinberg-a86994111/');
    expect(screen.getByLabelText('Twitter')).toHaveAttribute('href', 'https://twitter.com/TaylorLeprechau');
  });
});
