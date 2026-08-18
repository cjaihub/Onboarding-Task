'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  getMe,
  setTokens,
  clearTokens,
  getAccessToken,
  refreshAccessToken,
  type AuthUser,
} from '@/api/auth';

export type AuthUserProfile = Omit<AuthUser, 'access' | 'refresh'>;

interface AuthContextType {
  user: AuthUserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: {
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    password: string;
    password_confirm: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  // Legacy compat: expose currentUser + users for components that still use them
  currentUser: AuthUserProfile | null;
  users: AuthUserProfile[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: check if there's a valid token and restore session
  useEffect(() => {
    async function restoreSession() {
      setIsLoading(true);
      const token = getAccessToken();
      if (!token) {
        // Try refresh in case access expired but refresh still valid
        const newToken = await refreshAccessToken();
        if (!newToken) {
          setIsLoading(false);
          return;
        }
      }
      const profile = await getMe();
      if (profile) {
        setUser(profile);
        // Keep legacy userId in localStorage for X-User-ID fallback
        localStorage.setItem('userId', profile.id.toString());
      }
      setIsLoading(false);
    }
    restoreSession();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const data = await apiLogin(username, password);
    setTokens(data.access, data.refresh);
    localStorage.setItem('userId', data.id.toString());
    const { access: _a, refresh: _r, ...profile } = data;
    setUser(profile);
  }, []);

  const register = useCallback(async (formData: Parameters<AuthContextType['register']>[0]) => {
    const data = await apiRegister(formData);
    setTokens(data.access, data.refresh);
    localStorage.setItem('userId', data.id.toString());
    const { access: _a, refresh: _r, ...profile } = data;
    setUser(profile);
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        // Legacy compat
        currentUser: user,
        users: user ? [user] : [],
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
