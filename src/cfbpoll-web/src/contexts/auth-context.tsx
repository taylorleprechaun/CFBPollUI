import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { AuthContext, type AuthContextValue } from '../hooks/use-auth';
import { loginUser } from '../services/auth-api';

const TOKEN_KEY = 'cfbpoll_token';
const EXPIRY_KEY = 'cfbpoll_token_expiry';

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
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRY_KEY);
    setToken(null);
  }, [clearExpiryTimer]);

  const scheduleExpiry = useCallback((expiryMs: number) => {
    clearExpiryTimer();
    const remainingMs = Math.max(expiryMs - Date.now(), 0);
    expiryTimerRef.current = setTimeout(logout, remainingMs);
  }, [clearExpiryTimer, logout]);

  const login = useCallback(async (username: string, password: string) => {
    const response = await loginUser(username, password);
    const expiryMs = Date.now() + response.expiresIn * 1000;
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(EXPIRY_KEY, String(expiryMs));
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

function getStoredToken(): { expiryMs: number; token: string; } | null {
  const stored = localStorage.getItem(TOKEN_KEY);
  const expiry = localStorage.getItem(EXPIRY_KEY);
  if (!stored || !expiry) return null;

  const expiryMs = Number(expiry);
  if (Date.now() >= expiryMs) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRY_KEY);
    return null;
  }

  return { token: stored, expiryMs };
}
