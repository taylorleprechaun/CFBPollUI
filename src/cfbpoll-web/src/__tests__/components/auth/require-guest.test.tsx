import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { RequireGuest } from '../../../components/auth';

let mockIsAuthenticated = false;

vi.mock('../../../contexts/auth-context', () => ({
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
    login: vi.fn(),
    logout: vi.fn(),
    token: mockIsAuthenticated ? 'test-token' : null,
  }),
}));

function renderWithRoutes(initialRoute: string) {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route element={<RequireGuest />}>
          <Route path="/login" element={<div>Login Content</div>} />
        </Route>
        <Route path="/admin" element={<div>Admin Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('RequireGuest', () => {
  it('renders child route when not authenticated', () => {
    mockIsAuthenticated = false;
    renderWithRoutes('/login');

    expect(screen.getByText('Login Content')).toBeInTheDocument();
  });

  it('redirects to admin when authenticated', () => {
    mockIsAuthenticated = true;
    renderWithRoutes('/login');

    expect(screen.getByText('Admin Page')).toBeInTheDocument();
    expect(screen.queryByText('Login Content')).not.toBeInTheDocument();
  });
});
