import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../contexts/auth-context';
import { SeasonProvider } from '../contexts/season-context';
import App from '../App';

vi.mock('../pages/home-page', () => ({
  HomePage: () => <div>Home Page Content</div>
}));

vi.mock('../pages/rankings-page', () => ({
  RankingsPage: () => <div>Rankings Page Content</div>
}));

vi.mock('../pages/team-details-page', () => ({
  TeamDetailsPage: () => <div>Team Details Page Content</div>
}));

vi.mock('../pages/login-page', () => ({
  LoginPage: () => <div>Login Page Content</div>
}));

vi.mock('../pages/admin-page', () => ({
  AdminPage: () => <div>Admin Page Content</div>
}));

vi.mock('../hooks/use-seasons', () => ({
  useSeasons: () => ({
    data: { seasons: [2024, 2023] },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

function renderApp(initialRoute = '/') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <AuthProvider>
          <SeasonProvider>
            <App />
          </SeasonProvider>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
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

  it('renders login page at /login route', async () => {
    renderApp('/login');
    await waitFor(() => {
      expect(screen.getByText('Login Page Content')).toBeInTheDocument();
    });
  });

  it('renders admin page at /admin route', async () => {
    renderApp('/admin');
    await waitFor(() => {
      expect(screen.getByText('Admin Page Content')).toBeInTheDocument();
    });
  });

  it('includes Layout component with navigation', async () => {
    renderApp('/');
    await waitFor(() => {
      expect(screen.getByText('CFB Poll')).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Rankings')).toBeInTheDocument();
      expect(screen.getByText('Team Details')).toBeInTheDocument();
    });
  });

  it('shows lock icon when not authenticated', async () => {
    renderApp('/');
    await waitFor(() => {
      expect(screen.getByLabelText('Admin login')).toBeInTheDocument();
    });
  });
});
