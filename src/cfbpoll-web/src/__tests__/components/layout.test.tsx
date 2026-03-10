import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Layout } from '../../components/layout/layout';
import { ThemeProvider } from '../../contexts/theme-context';

let mockIsAuthenticated = false;
let mockAllTimeEnabled = true;
let mockPollLeadersEnabled = true;
let mockSeasonTrendsEnabled = true;

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
    seasonTrendsEnabled: mockSeasonTrendsEnabled,
  }),
}));

function renderLayout(initialEntries: string[] = ['/']) {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <Layout />
      </MemoryRouter>
    </ThemeProvider>
  );
}

describe('Layout', () => {
  beforeEach(() => {
    mockIsAuthenticated = false;
    mockAllTimeEnabled = true;
    mockPollLeadersEnabled = true;
    mockSeasonTrendsEnabled = true;
  });

  it('renders navigation with brand and Home link', () => {
    renderLayout();

    expect(screen.getByText('CFB Poll')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('renders Rankings dropdown button', () => {
    renderLayout();

    const rankingsButtons = screen.getAllByRole('button', { name: /Rankings/i });
    expect(rankingsButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('renders All-Time dropdown button when enabled', () => {
    renderLayout();

    const allTimeButtons = screen.getAllByRole('button', { name: /All-Time/i });
    expect(allTimeButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('Rankings dropdown shows items on click', async () => {
    renderLayout();

    const rankingsButton = screen.getAllByRole('button', { name: /Rankings/i })[0];
    await userEvent.click(rankingsButton);

    expect(screen.getByText('Teams')).toBeInTheDocument();
  });

  it('Rankings dropdown shows Trends when seasonTrendsEnabled', async () => {
    renderLayout();

    const rankingsButton = screen.getAllByRole('button', { name: /Rankings/i })[0];
    await userEvent.click(rankingsButton);

    expect(screen.getByText('Trends')).toBeInTheDocument();
  });

  it('Rankings dropdown hides Trends when seasonTrendsEnabled is false', async () => {
    mockSeasonTrendsEnabled = false;
    renderLayout();

    const rankingsButton = screen.getAllByRole('button', { name: /Rankings/i })[0];
    await userEvent.click(rankingsButton);

    expect(screen.queryByText('Trends')).not.toBeInTheDocument();
  });

  it('hides All-Time dropdown when both allTimeEnabled and pollLeadersEnabled are false', () => {
    mockAllTimeEnabled = false;
    mockPollLeadersEnabled = false;
    renderLayout();

    expect(screen.queryByRole('button', { name: /All-Time/i })).not.toBeInTheDocument();
  });

  it('All-Time dropdown shows All-Time link when allTimeEnabled', async () => {
    renderLayout();

    const allTimeButton = screen.getAllByRole('button', { name: /All-Time/i })[0];
    await userEvent.click(allTimeButton);

    const allTimeLinks = screen.getAllByText('All-Time');
    // One is the button label, the others are in the dropdown
    expect(allTimeLinks.length).toBeGreaterThanOrEqual(2);
  });

  it('hides All-Time link in dropdown when allTimeEnabled is false', async () => {
    mockAllTimeEnabled = false;
    mockPollLeadersEnabled = true;
    renderLayout();

    const allTimeButton = screen.getAllByRole('button', { name: /All-Time/i })[0];
    await userEvent.click(allTimeButton);

    // Only the button label should show, not a dropdown item link
    const links = screen.queryAllByRole('link');
    const allTimeLinks = links.filter(l => l.textContent === 'All-Time');
    expect(allTimeLinks).toHaveLength(0);
  });

  it('shows Leaders link in All-Time dropdown when pollLeadersEnabled', async () => {
    renderLayout();

    const allTimeButton = screen.getAllByRole('button', { name: /All-Time/i })[0];
    await userEvent.click(allTimeButton);

    expect(screen.getByText('Leaders')).toBeInTheDocument();
  });

  it('hides Leaders link when pollLeadersEnabled is false', async () => {
    mockPollLeadersEnabled = false;
    renderLayout();

    const allTimeButton = screen.getAllByRole('button', { name: /All-Time/i })[0];
    await userEvent.click(allTimeButton);

    expect(screen.queryByText('Leaders')).not.toBeInTheDocument();
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

  it('opens mobile menu with grouped sections', async () => {
    const user = userEvent.setup();
    renderLayout();

    await user.click(screen.getByLabelText('Open menu'));

    expect(screen.getByLabelText('Close menu')).toBeInTheDocument();
    // Mobile should have section headers
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

  it('shows conditional items in mobile menu', async () => {
    const user = userEvent.setup();
    renderLayout();

    await user.click(screen.getByLabelText('Open menu'));

    // Mobile should show Teams and Trends under Rankings section
    expect(screen.getByText('Teams')).toBeInTheDocument();
    expect(screen.getByText('Trends')).toBeInTheDocument();
  });

  it('hides conditional links in mobile menu when disabled', async () => {
    mockAllTimeEnabled = false;
    mockPollLeadersEnabled = false;
    mockSeasonTrendsEnabled = false;
    const user = userEvent.setup();
    renderLayout();

    await user.click(screen.getByLabelText('Open menu'));

    expect(screen.queryByText('Leaders')).not.toBeInTheDocument();
    // Trends should be hidden
    expect(screen.queryByText('Trends')).not.toBeInTheDocument();
  });

  it('renders footer with name and social links', () => {
    renderLayout();

    expect(screen.getByText('Taylor Steinberg')).toBeInTheDocument();
    expect(screen.getByLabelText('GitHub')).toHaveAttribute('href', 'https://github.com/taylorleprechaun');
    expect(screen.getByLabelText('LinkedIn')).toHaveAttribute('href', 'https://www.linkedin.com/in/taylor-steinberg-a86994111/');
    expect(screen.getByLabelText('Twitter')).toHaveAttribute('href', 'https://twitter.com/TaylorLeprechau');
  });
});
