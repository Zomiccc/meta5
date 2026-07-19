'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, getAccessToken, saveAuthTokens, clearAuthTokens } from './api';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const restore = async () => {
      const token = getAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const me = await api.get('/auth/me');
        setUser(me.data);
      } catch {
        const stillHasToken = getAccessToken();
        if (!stillHasToken) {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    restore();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    saveAuthTokens(res.data.accessToken, res.data.refreshToken);
    setUser(res.data.user);
    const role = res.data.user.role;
    router.push(role === 'admin' ? '/admin' : '/dashboard');
    return res.data.user;
  }, [router]);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch {}
    clearAuthTokens();
    setUser(null);
    router.push('/login');
  }, [router]);

  return { user, loading, login, logout };
}
