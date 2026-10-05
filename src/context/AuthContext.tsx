import React, { createContext, useContext, useState, useEffect } from 'react';
import { signIn, SIGN_IN_MESSAGES } from '../api/portalAuth';

export interface UserSession {
  username: string;
  clientAccountNumber: string;
  token: string;
  loginTime: string;
  role: 'client' | 'admin';
}

interface AuthContextType {
  user: UserSession | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  token: string;
  setToken: (token: string) => void;
  baseUrl: string;
  setBaseUrl: (url: string) => void;
  activeEnv: 'mock' | 'staging' | 'production';
  setActiveEnv: (env: 'mock' | 'staging' | 'production') => void;
}

const DEFAULT_SESSION_KEY = 'hnh_developer_session';
const DEFAULT_BASE_URL = 'https://api.harbourandhills.com';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Clients must sign in: only a session saved by a previous sign-in is restored.
  const [user, setUser] = useState<UserSession | null>(() => {
    try {
      const stored = localStorage.getItem(DEFAULT_SESSION_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // storage unavailable
    }
    // In production the server only serves the portal to signed-in visitors (middleware.ts),
    // so reaching this code means the session cookie is valid even if nothing was stored locally.
    return import.meta.env.DEV
      ? null
      : { username: 'Client', clientAccountNumber: '102-344-001-01-00-0001-00000', token: '', loginTime: new Date().toISOString(), role: 'client' };
  });

  // Bearer token for the API console, set by a successful 1.1 call in the sandbox. Separate from the portal session.
  const [apiToken, setApiToken] = useState('');
  const [baseUrl, setBaseUrl] = useState<string>(DEFAULT_BASE_URL);
  const [activeEnv, setActiveEnv] = useState<'mock' | 'staging' | 'production'>('mock');

  useEffect(() => {
    try {
      if (user) localStorage.setItem(DEFAULT_SESSION_KEY, JSON.stringify(user));
      else localStorage.removeItem(DEFAULT_SESSION_KEY);
    } catch {
      // storage unavailable
    }
  }, [user]);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!username.trim() || !password) return { success: false, error: 'Enter your username and password.' };
    const result = await signIn(username.trim(), password);
    if (!result.ok) return { success: false, error: result.message || SIGN_IN_MESSAGES[result.error] };
    setUser({
      username: result.user.username,
      clientAccountNumber: result.user.clientAccountNumber,
      token: result.token,
      loginTime: new Date().toISOString(),
      role: 'client',
    });
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    setApiToken('');
    if (!import.meta.env.DEV) {
      fetch('/api/logout', { method: 'POST' }).finally(() => window.location.replace('/login.html'));
    }
  };

  const setToken = (newToken: string) => setApiToken(newToken);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        token: apiToken,
        setToken,
        baseUrl,
        setBaseUrl,
        activeEnv,
        setActiveEnv
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
