import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../App';

vi.mock('../pages/home-page', () => ({
  HomePage: () => <div>Home Page Content</div>
}));

vi.mock('../pages/rankings-page', () => ({
  RankingsPage: () => <div>Rankings Page Content</div>
}));

function renderApp(initialRoute = '/') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <App />
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

  it('includes Layout component with navigation', async () => {
    renderApp('/');
    await waitFor(() => {
      expect(screen.getByText('CFB Poll')).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Rankings')).toBeInTheDocument();
    });
  });
});
