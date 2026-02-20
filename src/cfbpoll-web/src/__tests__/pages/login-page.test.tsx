import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from '../../pages/login-page';

const mockNavigate = vi.fn();
const mockLogin = vi.fn();
let mockIsAuthenticated = false;

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../contexts/auth-context', () => ({
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
    login: mockLogin,
    logout: vi.fn(),
    token: mockIsAuthenticated ? 'test-token' : null,
  }),
}));

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthenticated = false;
  });

  it('renders login form', () => {
    renderLoginPage();

    expect(screen.getByText('Admin Login')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log In' })).toBeInTheDocument();
  });

  it('submits credentials on form submit', async () => {
    mockLogin.mockResolvedValue(undefined);
    renderLoginPage();

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: 'Log In' }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin', 'secret');
    });
  });

  it('shows error message on login failure', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid credentials'));
    renderLoginPage();

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: 'Log In' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials');
    });
  });

  it('navigates to admin on successful login', async () => {
    mockLogin.mockResolvedValue(undefined);
    renderLoginPage();

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: 'Log In' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin');
    });
  });

  it('disables button while submitting', async () => {
    mockLogin.mockImplementation(() => new Promise(() => {}));
    renderLoginPage();

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: 'Log In' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Logging in...' })).toBeDisabled();
    });
  });
});
