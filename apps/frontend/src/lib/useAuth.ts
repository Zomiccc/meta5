'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from './api';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Try to restore session from HttpOnly cookie via /auth/me.
    // The global axios interceptor will auto-refresh expired access tokens.
    const restore = async () => {
      try {
        const me = await api.get('/auth/me');
        setUser(me.data);
      } catch {
        localStorage.removeItem('accessToken');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    restore();
  }, [router]);

  return { user, loading };
}
