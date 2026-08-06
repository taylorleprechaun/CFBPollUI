import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { RequireAuth } from '../../../components/auth';

let mockIsAuthenticated = false;

vi.mock('../../../hooks/use-auth', () => ({
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
        <Route element={<RequireAuth />}>
          <Route path="/admin" element={<div>Admin Content</div>} />
        </Route>
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('RequireAuth', () => {
  it('renders child route when authenticated', () => {
    mockIsAuthenticated = true;
    renderWithRoutes('/admin');

    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it('redirects to login when not authenticated', () => {
    mockIsAuthenticated = false;
    renderWithRoutes('/admin');

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });
});
