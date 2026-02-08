// src/auth/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch, setAccessToken } from '../api/client';

interface AuthContextValue {
  token: string | null;
  user: any;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  restoreSession: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = 'user_module_access_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  const isAuthenticated = !!token;

  async function login(email: string, password: string) {
    const body = new URLSearchParams({
      username: email,
      password,
    }).toString();

    const res = await apiFetch<{ access_token: string }>("/auth/login", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    setToken(res.access_token);
    setAccessToken(res.access_token);
    localStorage.setItem(TOKEN_KEY, res.access_token);

    try {
      const userInfo = await apiFetch('/users/me');
      setUser(userInfo);
    } catch (error) {
      console.error('Failed to fetch user info:', error);
    }
  }

  function logout() {
    setToken(null);
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem(TOKEN_KEY);
  }

  function restoreSession() {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (saved) {
      setToken(saved);
      setAccessToken(saved);
      apiFetch('/users/me').then(setUser).catch(() => {
        console.error('Token expired or invalid, clearing session');
        logout();
      });
    }
  }

  useEffect(() => {
    restoreSession();
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated, login, logout, restoreSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}