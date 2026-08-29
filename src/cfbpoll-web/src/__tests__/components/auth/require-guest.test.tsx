import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { RequireGuest } from '../../../components/auth';

let mockIsAuthenticated = false;

vi.mock('../../../hooks/use-auth', () => ({
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
    login: vi.fn(),
    logout: vi.fn(),
    token: mockIsAuthenticated ? 'test-token' : null,
  }),
}));

function renderWithRoutes(initialEntry: string | { pathname: string; state?: unknown }) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<RequireGuest />}>
          <Route path="/login" element={<div>Login Content</div>} />
        </Route>
        <Route path="/" element={<div>Home Page</div>} />
        <Route path="/admin/rankings-snapshots" element={<div>Rankings Snapshots Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('RequireGuest', () => {
  it('redirects to home when authenticated with no return path', () => {
    mockIsAuthenticated = true;
    renderWithRoutes('/login');

    expect(screen.getByText('Home Page')).toBeInTheDocument();
    expect(screen.queryByText('Login Content')).not.toBeInTheDocument();
  });

  it('redirects to the return path when authenticated with state.from', () => {
    mockIsAuthenticated = true;
    renderWithRoutes({ pathname: '/login', state: { from: '/admin/rankings-snapshots' } });

    expect(screen.getByText('Rankings Snapshots Page')).toBeInTheDocument();
    expect(screen.queryByText('Login Content')).not.toBeInTheDocument();
  });

  it('renders child route when not authenticated', () => {
    mockIsAuthenticated = false;
    renderWithRoutes('/login');

    expect(screen.getByText('Login Content')).toBeInTheDocument();
  });
});
