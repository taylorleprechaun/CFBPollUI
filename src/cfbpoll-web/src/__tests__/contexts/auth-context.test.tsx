import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../contexts/auth-context';

vi.mock('../../services/admin-api', () => ({
  loginUser: vi.fn(),
}));

import { loginUser } from '../../services/admin-api';

function TestConsumer() {
  const { isAuthenticated, token, login, logout } = useAuth();

  return (
    <div>
      <span data-testid="auth-status">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</span>
      <span data-testid="token">{token ?? 'no-token'}</span>
      <button onClick={() => login('admin', 'password')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('starts unauthenticated when no token in storage', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-status').textContent).toBe('not-authenticated');
    expect(screen.getByTestId('token').textContent).toBe('no-token');
  });

  it('restores token from localStorage if not expired', () => {
    localStorage.setItem('cfbpoll_token', 'stored-token');
    localStorage.setItem('cfbpoll_token_expiry', String(Date.now() + 60000));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-status').textContent).toBe('authenticated');
    expect(screen.getByTestId('token').textContent).toBe('stored-token');
  });

  it('clears expired token from localStorage on mount', () => {
    localStorage.setItem('cfbpoll_token', 'expired-token');
    localStorage.setItem('cfbpoll_token_expiry', String(Date.now() - 1000));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-status').textContent).toBe('not-authenticated');
  });

  it('login stores token and updates state', async () => {
    vi.mocked(loginUser).mockResolvedValue({
      token: 'new-jwt-token',
      expiresIn: 28800,
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Login'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-status').textContent).toBe('authenticated');
      expect(screen.getByTestId('token').textContent).toBe('new-jwt-token');
    });

    expect(localStorage.getItem('cfbpoll_token')).toBe('new-jwt-token');
  });

  it('logout clears token and storage', async () => {
    vi.mocked(loginUser).mockResolvedValue({
      token: 'jwt-token',
      expiresIn: 28800,
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Login'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-status').textContent).toBe('authenticated');
    });

    act(() => {
      fireEvent.click(screen.getByText('Logout'));
    });

    expect(screen.getByTestId('auth-status').textContent).toBe('not-authenticated');
    expect(localStorage.getItem('cfbpoll_token')).toBeNull();
  });

  it('throws error when useAuth is used outside AuthProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TestConsumer />)).toThrow(
      'useAuth must be used within an AuthProvider'
    );

    consoleError.mockRestore();
  });
});
