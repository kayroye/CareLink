'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { User } from '@/lib/db/schema';
import { getSession, createSession, clearSession } from '@/lib/auth';
import { getDatabase } from '@/lib/db';
import { startSync, stopSync } from '@/lib/db/sync';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isNurse: boolean;
  isPatient: boolean;
  login: (email: string, password?: string) => Promise<void>;
  loginWithMagicLink: (token: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Start sync for user
  const initSync = useCallback(async (userRole: 'nurse' | 'patient') => {
    try {
      const db = await getDatabase();
      await startSync(db, userRole);
      console.log(`Sync started for ${userRole}`);
    } catch (error) {
      console.error('Failed to start sync:', error);
    }
  }, []);

  // Initialize from localStorage on mount
  useEffect(() => {
    const storedUser = getSession();
    if (storedUser) {
      setUser(storedUser);
      // Start sync for existing session
      initSync(storedUser.role);
    }
    setLoading(false);
  }, [initSync]);

  const login = useCallback(async (email: string, password?: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      const loggedInUser = data.user as User;
      setUser(loggedInUser);
      createSession(loggedInUser);
      // Start sync after login
      initSync(loggedInUser.role);
    } finally {
      setLoading(false);
    }
  }, [initSync]);

  const loginWithMagicLink = useCallback(async (token: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/auth/magic-link/verify?token=${encodeURIComponent(token)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Magic link verification failed');
      }

      const loggedInUser = data.user as User;
      setUser(loggedInUser);
      createSession(loggedInUser);
      // Start sync after magic link login
      initSync(loggedInUser.role);
    } finally {
      setLoading(false);
    }
  }, [initSync]);

  const logout = useCallback(async () => {
    // Stop sync before clearing session
    await stopSync();
    console.log('Sync stopped');

    setUser(null);
    clearSession();

    // Also call the server-side logout endpoint
    fetch('/api/auth/logout', {
      method: 'POST',
    }).catch(console.error);
  }, []);

  const isAuthenticated = user !== null;
  const isNurse = user?.role === 'nurse';
  const isPatient = user?.role === 'patient';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isNurse,
        isPatient,
        login,
        loginWithMagicLink,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
