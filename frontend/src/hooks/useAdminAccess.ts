import { useCallback, useEffect, useState } from 'react';
import {
  checkAdminAccess,
  clearStoredAdminToken,
  getStoredAdminToken,
  saveStoredAdminToken,
  type AdminAccessStatus,
} from '@/lib/adminApi';

export function useAdminAccess() {
  const [isLoading, setIsLoading] = useState(true);
  const [access, setAccess] = useState<AdminAccessStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const nextAccess = await checkAdminAccess();
      setAccess(nextAccess);
      setError(null);
    } catch (err) {
      setAccess(null);
      setError(err instanceof Error ? err.message : 'Unable to verify admin access.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveToken = useCallback(
    async (token: string) => {
      saveStoredAdminToken(token);
      await refresh();
    },
    [refresh],
  );

  const clearToken = useCallback(async () => {
    clearStoredAdminToken();
    await refresh();
  }, [refresh]);

  return {
    isLoading,
    isAuthorized: Boolean(access?.authorized),
    access,
    error,
    refresh,
    saveToken,
    clearToken,
    storedToken: getStoredAdminToken(),
  };
}
