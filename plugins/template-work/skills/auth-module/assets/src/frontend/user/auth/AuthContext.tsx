import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch, setAccessToken } from '../api/client';

interface AuthContextValue {
  token: string | null;
  balance: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  refreshBalance: () => Promise<void>;
  logout: () => void;
  restoreSession: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = 'ps_plugin_access_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);

  const isAuthenticated = !!token;

  async function login(email: string, password: string) {
    // AI_Amend 2026-01-28 登录成功后拉取积分余额
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

    await refreshBalance();
    // AI_Amend END
  }

  async function refreshBalance() {
    try {
      const res = await apiFetch<string>('/points/balance');
      setBalance(res);
    } catch {
      setBalance(null);
    }
  }

  function logout() {
    setToken(null);
    setBalance(null);
    setAccessToken(null);
    localStorage.removeItem(TOKEN_KEY);
  }

  function restoreSession() {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (saved) {
      setToken(saved);
      setAccessToken(saved);
      // 恢复 Token 后立即刷新积分余额
      refreshBalance().catch(() => {
        // 如果刷新失败（Token 过期），清除 Token
        console.error('Token expired or invalid, clearing session');
        logout();
      });
    }
  }

  useEffect(() => {
    restoreSession();
  }, []);

  return (
    <AuthContext.Provider value={{ token, balance, isAuthenticated, login, refreshBalance, logout, restoreSession }}>
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
