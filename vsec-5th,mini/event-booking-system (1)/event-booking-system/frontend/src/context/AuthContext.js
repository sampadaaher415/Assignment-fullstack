import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as api from '../api';

const AuthContext = createContext(null);
const STORAGE_KEY = 'seatwise.token';

function readToken() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeToken(token) {
  try {
    if (token) localStorage.setItem(STORAGE_KEY, token);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable: the session just won't survive a reload */
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    const t = readToken();
    api.setAuthToken(t);
    return t;
  });
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(!token);

  const applySession = useCallback((nextToken, nextUser) => {
    api.setAuthToken(nextToken);
    writeToken(nextToken);
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => applySession(null, null), [applySession]);

  useEffect(() => {
    api.setUnauthorizedHandler(logout);
  }, [logout]);

  useEffect(() => {
    if (!token || user) return;
    let active = true;
    api
      .getMe()
      .then((me) => active && setUser(me))
      .catch(() => active && logout())
      .finally(() => active && setReady(true));
    return () => {
      active = false;
    };
  }, [token, user, logout]);

  const login = useCallback(
    async (credentials) => {
      const { token: t, user: u } = await api.login(credentials);
      applySession(t, u);
      setReady(true);
      return u;
    },
    [applySession]
  );

  const register = useCallback(
    async (details) => {
      const { token: t, user: u } = await api.register(details);
      applySession(t, u);
      setReady(true);
      return u;
    },
    [applySession]
  );

  const value = useMemo(
    () => ({ user, ready, isAdmin: user?.role === 'admin', login, register, logout }),
    [user, ready, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
