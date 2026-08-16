import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api } from '../services/api';

export type User = {
  id: string;
  email: string;
  fullName?: string;
  role: 'farmer' | 'expert' | 'admin';
  isGuest?: boolean;
};

type AuthState = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName?: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  updateLocalUser: (patch: Partial<User>) => void;
};

const AuthContext = createContext<AuthState | null>(null);

const STORAGE_KEY = 'smart_agro_auth';

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function normalizeUser(raw: User & { id?: string; _id?: string }): User {
  return {
    id: raw.id || raw._id || '',
    email: raw.email,
    fullName: raw.fullName,
    role: raw.role,
    isGuest: Boolean(raw.isGuest),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const stored = loadStored();
  const [user, setUser] = useState<User | null>(stored?.user ?? null);
  const [accessToken, setAccessToken] = useState<string | null>(stored?.accessToken ?? null);
  const [refreshToken, setRefreshToken] = useState<string | null>(stored?.refreshToken ?? null);

  const persist = useCallback((next: { user: User; accessToken: string; refreshToken: string }) => {
    setUser(next.user);
    setAccessToken(next.accessToken);
    setRefreshToken(next.refreshToken);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  useEffect(() => {
    function onRefreshed(e: Event) {
      const detail = (e as CustomEvent).detail as {
        user?: User;
        accessToken?: string;
        refreshToken?: string;
      };
      if (detail?.accessToken) {
        setAccessToken(detail.accessToken);
        if (detail.refreshToken) setRefreshToken(detail.refreshToken);
        if (detail.user) setUser(detail.user);
      }
    }
    function onExpired() {
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
    }
    window.addEventListener('smartagro:auth-refreshed', onRefreshed);
    window.addEventListener('smartagro:auth-expired', onExpired);
    return () => {
      window.removeEventListener('smartagro:auth-refreshed', onRefreshed);
      window.removeEventListener('smartagro:auth-expired', onExpired);
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await api<{
        accessToken: string;
        refreshToken: string;
        user: User & { id?: string; _id?: string };
      }>('/auth/login', { method: 'POST', body: { email, password } });
      persist({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: normalizeUser(data.user),
      });
    },
    [persist]
  );

  const register = useCallback(
    async (email: string, password: string, fullName = '') => {
      const data = await api<{
        accessToken: string;
        refreshToken: string;
        user: User & { id?: string; _id?: string };
      }>('/auth/register', {
        method: 'POST',
        body: { email, password, fullName: fullName || undefined },
      });
      persist({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: normalizeUser(data.user),
      });
    },
    [persist]
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      if (!accessToken) throw new Error('Not signed in');
      await api<{ message: string }>('/auth/change-password', {
        method: 'POST',
        token: accessToken,
        body: { currentPassword, newPassword },
      });
    },
    [accessToken]
  );

  const loginAsGuest = useCallback(async () => {
    const data = await api<{
      accessToken: string;
      refreshToken: string;
      user: User & { id?: string; _id?: string };
    }>('/auth/guest', { method: 'POST' });
    persist({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: normalizeUser({
        ...data.user,
        fullName: data.user.fullName || 'Guest Farmer',
        role: data.user.role || 'farmer',
        isGuest: true,
      }),
    });
  }, [persist]);

  const logout = useCallback(async () => {
    try {
      if (accessToken && refreshToken) {
        await api('/auth/logout', {
          method: 'POST',
          token: accessToken,
          body: { refreshToken },
        });
      }
    } finally {
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [accessToken, refreshToken]);

  const updateLocalUser = useCallback(
    (patch: Partial<User>) => {
      setUser((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...patch };
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          const storedAuth = raw ? JSON.parse(raw) : {};
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ ...storedAuth, user: next, accessToken, refreshToken })
          );
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [accessToken, refreshToken]
  );

  const value = useMemo(
    () => ({
      user,
      accessToken,
      refreshToken,
      login,
      register,
      changePassword,
      loginAsGuest,
      logout,
      updateLocalUser,
    }),
    [
      user,
      accessToken,
      refreshToken,
      login,
      register,
      changePassword,
      loginAsGuest,
      logout,
      updateLocalUser,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
