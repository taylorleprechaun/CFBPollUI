import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
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

function getStoredToken(): { token: string; expiryMs: number } | null {
  const stored = sessionStorage.getItem(TOKEN_KEY);
  const expiry = sessionStorage.getItem(EXPIRY_KEY);
  if (!stored || !expiry) return null;

  const expiryMs = Number(expiry);
  if (Date.now() >= expiryMs) {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(EXPIRY_KEY);
    return null;
  }

  return { token: stored, expiryMs };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    const stored = getStoredToken();
    return stored?.token ?? null;
  });
  const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearExpiryTimer = useCallback(() => {
    if (expiryTimerRef.current !== null) {
      clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = null;
    }
  }, []);

  const logout = useCallback(() => {
    clearExpiryTimer();
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(EXPIRY_KEY);
    setToken(null);
  }, [clearExpiryTimer]);

  const scheduleExpiry = useCallback((expiryMs: number) => {
    clearExpiryTimer();
    const remainingMs = expiryMs - Date.now();
    if (remainingMs <= 0) {
      logout();
      return;
    }
    expiryTimerRef.current = setTimeout(logout, remainingMs);
  }, [clearExpiryTimer, logout]);

  const login = useCallback(async (username: string, password: string) => {
    const response = await loginUser(username, password);
    const expiryMs = Date.now() + response.expiresIn * 1000;
    sessionStorage.setItem(TOKEN_KEY, response.token);
    sessionStorage.setItem(EXPIRY_KEY, String(expiryMs));
    setToken(response.token);
    scheduleExpiry(expiryMs);
  }, [scheduleExpiry]);

  const value = useMemo<AuthContextValue>(() => ({
    isAuthenticated: token !== null,
    login,
    logout,
    token,
  }), [login, logout, token]);

  useEffect(() => {
    const stored = getStoredToken();
    if (stored) {
      scheduleExpiry(stored.expiryMs);
    }
    return clearExpiryTimer;
  }, [clearExpiryTimer, scheduleExpiry]);

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
