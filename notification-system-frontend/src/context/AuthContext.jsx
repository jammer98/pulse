import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { request } from '../api/client';

const AuthContext = createContext(null);
const TOKEN_KEY = 'pulse_token';
const USER_KEY = 'pulse_user';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
  });

  const saveSession = useCallback((session) => {
    localStorage.setItem(TOKEN_KEY, session.token);
    localStorage.setItem(USER_KEY, JSON.stringify(session.user));
    setToken(session.token);
    setUser(session.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => logout();
    window.addEventListener('pulse:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('pulse:unauthorized', handleUnauthorized);
  }, [logout]);

  useEffect(() => {
    if (!token) return;
    request('/api/auth/me', { token })
      .then((result) => {
        setUser(result.user);
        localStorage.setItem(USER_KEY, JSON.stringify(result.user));
      })
      .catch((error) => { if (error.status === 401) logout(); });
  }, [token, logout]);

  const value = useMemo(() => ({ token, user, isAuthenticated: Boolean(token), saveSession, logout }), [token, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
