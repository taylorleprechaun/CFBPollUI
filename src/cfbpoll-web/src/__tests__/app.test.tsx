import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import App from '../App';
import { AuthProvider } from '../contexts/auth-context';
import { SeasonProvider } from '../contexts/season-context';
import { ThemeProvider } from '../contexts/theme-context';

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

const MockPublicPredictionsPage = () => <div>Public Predictions Page Content</div>;
vi.mock('../pages/public-predictions-page', () => ({
  PublicPredictionsPage: MockPublicPredictionsPage,
  default: MockPublicPredictionsPage,
}));

const MockTrackRecordPage = () => <div>Track Record Page Content</div>;
vi.mock('../pages/track-record-page', () => ({
  TrackRecordPage: MockTrackRecordPage,
  default: MockTrackRecordPage,
}));

const MockTeamPredictionRecordsPage = () => <div>Team Prediction Records Page Content</div>;
vi.mock('../pages/team-prediction-records-page', () => ({
  TeamPredictionRecordsPage: MockTeamPredictionRecordsPage,
  default: MockTeamPredictionRecordsPage,
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

let mockPredictionsPageEnabled = true;

vi.mock('../hooks/use-page-visibility', () => ({
  usePageVisibility: () => ({
    allTimeEnabled: true,
    isLoading: false,
    pollLeadersEnabled: true,
    predictionsPageEnabled: mockPredictionsPageEnabled,
    seasonTrendsEnabled: true,
  }),
}));

afterEach(() => {
  localStorage.clear();
  mockPredictionsPageEnabled = true;
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
  it('includes Layout component with navigation', async () => {
    renderApp('/');
    await waitFor(() => {
      expect(screen.getByText('CFB Poll')).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
      const rankingsButtons = screen.getAllByRole('button', { name: /Rankings/i });
      expect(rankingsButtons.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('redirects /admin to /admin/snapshots when authenticated', async () => {
    localStorage.setItem('cfbpoll_token', 'test-token');
    localStorage.setItem('cfbpoll_token_expiry', String(Date.now() + 86400000));

    renderApp('/admin');
    await waitFor(() => {
      expect(screen.getByText('Snapshots Page Content')).toBeInTheDocument();
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

  it('redirects /login to home when authenticated', async () => {
    localStorage.setItem('cfbpoll_token', 'test-token');
    localStorage.setItem('cfbpoll_token_expiry', String(Date.now() + 86400000));

    renderApp('/login');
    await waitFor(() => {
      expect(screen.getByText('Home Page Content')).toBeInTheDocument();
    });
  });

  it('redirects /predictions to home when predictions page is disabled', async () => {
    mockPredictionsPageEnabled = false;

    renderApp('/predictions');
    await waitFor(() => {
      expect(screen.getByText('Home Page Content')).toBeInTheDocument();
    });
  });

  it('redirects /team-prediction-records to home when predictions page is disabled', async () => {
    mockPredictionsPageEnabled = false;

    renderApp('/team-prediction-records');
    await waitFor(() => {
      expect(screen.getByText('Home Page Content')).toBeInTheDocument();
    });
  });

  it('redirects /track-record to home when predictions page is disabled', async () => {
    mockPredictionsPageEnabled = false;

    renderApp('/track-record');
    await waitFor(() => {
      expect(screen.getByText('Home Page Content')).toBeInTheDocument();
    });
  });

  it('renders home page at root route', async () => {
    renderApp('/');
    await waitFor(() => {
      expect(screen.getByText('Home Page Content')).toBeInTheDocument();
    });
  });

  it('renders login page at /login route when not authenticated', async () => {
    renderApp('/login');
    await waitFor(() => {
      expect(screen.getByText('Login Page Content')).toBeInTheDocument();
    });
  });

  it('renders predictions page at /admin/predictions when authenticated', async () => {
    localStorage.setItem('cfbpoll_token', 'test-token');
    localStorage.setItem('cfbpoll_token_expiry', String(Date.now() + 86400000));

    renderApp('/admin/predictions');
    await waitFor(() => {
      expect(screen.getByText('Predictions Page Content')).toBeInTheDocument();
    });
  });

  it('renders public predictions page at /predictions route when enabled', async () => {
    renderApp('/predictions');
    await waitFor(() => {
      expect(screen.getByText('Public Predictions Page Content')).toBeInTheDocument();
    });
  });

  it('renders rankings page at /rankings route', async () => {
    renderApp('/rankings');
    await waitFor(() => {
      expect(screen.getByText('Rankings Page Content')).toBeInTheDocument();
    });
  });

  it('renders settings page at /admin/settings when authenticated', async () => {
    localStorage.setItem('cfbpoll_token', 'test-token');
    localStorage.setItem('cfbpoll_token_expiry', String(Date.now() + 86400000));

    renderApp('/admin/settings');
    await waitFor(() => {
      expect(screen.getByText('Settings Page Content')).toBeInTheDocument();
    });
  });

  it('renders snapshots page at /admin/snapshots when authenticated', async () => {
    localStorage.setItem('cfbpoll_token', 'test-token');
    localStorage.setItem('cfbpoll_token_expiry', String(Date.now() + 86400000));

    renderApp('/admin/snapshots');
    await waitFor(() => {
      expect(screen.getByText('Snapshots Page Content')).toBeInTheDocument();
    });
  });

  it('renders team details page at /team-details route', async () => {
    renderApp('/team-details');
    await waitFor(() => {
      expect(screen.getByText('Team Details Page Content')).toBeInTheDocument();
    });
  });

  it('renders team prediction records page at /team-prediction-records route when enabled', async () => {
    renderApp('/team-prediction-records');
    await waitFor(() => {
      expect(screen.getByText('Team Prediction Records Page Content')).toBeInTheDocument();
    });
  });

  it('renders track record page at /track-record route when enabled', async () => {
    renderApp('/track-record');
    await waitFor(() => {
      expect(screen.getByText('Track Record Page Content')).toBeInTheDocument();
    });
  });

  it('shows lock icon when not authenticated', async () => {
    renderApp('/');
    await waitFor(() => {
      expect(screen.getByLabelText('Admin login')).toBeInTheDocument();
    });
  });
});
