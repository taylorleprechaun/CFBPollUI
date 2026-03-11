import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../contexts/auth-context';
import { SeasonProvider } from '../contexts/season-context';
import { ThemeProvider } from '../contexts/theme-context';
import App from '../App';

const MockHomePage = () => <div>Home Page Content</div>;
vi.mock('../pages/home-page', () => ({
  HomePage: MockHomePage,
  default: MockHomePage,
}));

const MockRankingsPage = () => <div>Rankings Page Content</div>;
vi.mock('../pages/rankings-page', () => ({
  RankingsPage: MockRankingsPage,
  default: MockRankingsPage,
}));

const MockTeamDetailsPage = () => <div>Team Details Page Content</div>;
vi.mock('../pages/team-details-page', () => ({
  TeamDetailsPage: MockTeamDetailsPage,
  default: MockTeamDetailsPage,
}));

const MockLoginPage = () => <div>Login Page Content</div>;
vi.mock('../pages/login-page', () => ({
  LoginPage: MockLoginPage,
  default: MockLoginPage,
}));

const MockSnapshotsPage = () => <div>Snapshots Page Content</div>;
vi.mock('../pages/snapshots-page', () => ({
  SnapshotsPage: MockSnapshotsPage,
  default: MockSnapshotsPage,
}));

const MockPredictionsPage = () => <div>Predictions Page Content</div>;
vi.mock('../pages/predictions-page', () => ({
  PredictionsPage: MockPredictionsPage,
  default: MockPredictionsPage,
}));

const MockSettingsPage = () => <div>Settings Page Content</div>;
vi.mock('../pages/settings-page', () => ({
  SettingsPage: MockSettingsPage,
  default: MockSettingsPage,
}));

vi.mock('../hooks/use-seasons', () => ({
  useSeasons: () => ({
    data: { seasons: [2024, 2023] },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock('../hooks/use-page-visibility', () => ({
  usePageVisibility: () => ({
    allTimeEnabled: true,
    isLoading: false,
    pollLeadersEnabled: true,
    seasonTrendsEnabled: true,
  }),
}));

afterEach(() => {
  sessionStorage.clear();
});

function renderApp(initialRoute = '/') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });

  return render(
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialRoute]}>
          <AuthProvider>
            <SeasonProvider>
              <App />
            </SeasonProvider>
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

describe('App', () => {
  it('renders home page at root route', async () => {
    renderApp('/');
    await waitFor(() => {
      expect(screen.getByText('Home Page Content')).toBeInTheDocument();
    });
  });

  it('renders rankings page at /rankings route', async () => {
    renderApp('/rankings');
    await waitFor(() => {
      expect(screen.getByText('Rankings Page Content')).toBeInTheDocument();
    });
  });

  it('renders team details page at /team-details route', async () => {
    renderApp('/team-details');
    await waitFor(() => {
      expect(screen.getByText('Team Details Page Content')).toBeInTheDocument();
    });
  });

  it('renders login page at /login route when not authenticated', async () => {
    renderApp('/login');
    await waitFor(() => {
      expect(screen.getByText('Login Page Content')).toBeInTheDocument();
    });
  });

  it('redirects /login to admin/snapshots when authenticated', async () => {
    sessionStorage.setItem('cfbpoll_token', 'test-token');
    sessionStorage.setItem('cfbpoll_token_expiry', String(Date.now() + 86400000));

    renderApp('/login');
    await waitFor(() => {
      expect(screen.getByText('Snapshots Page Content')).toBeInTheDocument();
    });
  });

  it('redirects /admin to /admin/snapshots when authenticated', async () => {
    sessionStorage.setItem('cfbpoll_token', 'test-token');
    sessionStorage.setItem('cfbpoll_token_expiry', String(Date.now() + 86400000));

    renderApp('/admin');
    await waitFor(() => {
      expect(screen.getByText('Snapshots Page Content')).toBeInTheDocument();
    });
  });

  it('renders snapshots page at /admin/snapshots when authenticated', async () => {
    sessionStorage.setItem('cfbpoll_token', 'test-token');
    sessionStorage.setItem('cfbpoll_token_expiry', String(Date.now() + 86400000));

    renderApp('/admin/snapshots');
    await waitFor(() => {
      expect(screen.getByText('Snapshots Page Content')).toBeInTheDocument();
    });
  });

  it('renders predictions page at /admin/predictions when authenticated', async () => {
    sessionStorage.setItem('cfbpoll_token', 'test-token');
    sessionStorage.setItem('cfbpoll_token_expiry', String(Date.now() + 86400000));

    renderApp('/admin/predictions');
    await waitFor(() => {
      expect(screen.getByText('Predictions Page Content')).toBeInTheDocument();
    });
  });

  it('renders settings page at /admin/settings when authenticated', async () => {
    sessionStorage.setItem('cfbpoll_token', 'test-token');
    sessionStorage.setItem('cfbpoll_token_expiry', String(Date.now() + 86400000));

    renderApp('/admin/settings');
    await waitFor(() => {
      expect(screen.getByText('Settings Page Content')).toBeInTheDocument();
    });
  });

  it('redirects /admin to login when not authenticated', async () => {
    renderApp('/admin');
    await waitFor(() => {
      expect(screen.getByText('Login Page Content')).toBeInTheDocument();
    });
  });

  it('redirects /admin/snapshots to login when not authenticated', async () => {
    renderApp('/admin/snapshots');
    await waitFor(() => {
      expect(screen.getByText('Login Page Content')).toBeInTheDocument();
    });
  });

  it('includes Layout component with navigation', async () => {
    renderApp('/');
    await waitFor(() => {
      expect(screen.getByText('CFB Poll')).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
      const rankingsButtons = screen.getAllByRole('button', { name: /Rankings/i });
      expect(rankingsButtons.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows lock icon when not authenticated', async () => {
    renderApp('/');
    await waitFor(() => {
      expect(screen.getByLabelText('Admin login')).toBeInTheDocument();
    });
  });
});
