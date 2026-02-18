import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { loginUser } from '../services/admin-api';

interface AuthContextValue {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  token: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'cfbpoll_token';
const EXPIRY_KEY = 'cfbpoll_token_expiry';

function isTokenExpired(): boolean {
  const expiry = localStorage.getItem(EXPIRY_KEY);
  if (!expiry) return true;
  return Date.now() >= Number(expiry);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored && !isTokenExpired()) return stored;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRY_KEY);
    return null;
  });

  useEffect(() => {
    if (token && isTokenExpired()) {
      setToken(null);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(EXPIRY_KEY);
    }
  }, [token]);

  const login = useCallback(async (username: string, password: string) => {
    const response = await loginUser(username, password);
    const expiryMs = Date.now() + response.expiresIn * 1000;
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(EXPIRY_KEY, String(expiryMs));
    setToken(response.token);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRY_KEY);
    setToken(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    isAuthenticated: token !== null,
    login,
    logout,
    token,
  }), [login, logout, token]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
