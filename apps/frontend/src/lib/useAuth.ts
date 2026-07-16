'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getAccessToken } from './api';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const restore = async () => {
      const token = getAccessToken();
      if (!token) {
        setLoading(false);
        router.push('/login');
        return;
      }

      try {
        const me = await api.get('/auth/me');
        setUser(me.data);
      } catch {
        // The axios interceptor will have already attempted a refresh.
        // If we still fail here, the interceptor has cleared tokens and redirected.
        // Only redirect if tokens are actually gone.
        const stillHasToken = getAccessToken();
        if (!stillHasToken) {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    restore();
  }, [router]);

  return { user, loading };
}
