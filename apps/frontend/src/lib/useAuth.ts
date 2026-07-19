'use client';

import { useEffect, useState } from 'react';
import { api, getAccessToken } from './api';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  return { user, loading };
}
