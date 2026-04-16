import { useCallback, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { checkAdminAccess, getStoredAdminToken } from '@/lib/adminApi';

const ALLOWED_STATUSES = new Set(['active', 'trialing']);
const REQUEST_TIMEOUT_MS = 8000;

function withTimeout<T>(promise: Promise<T>, timeoutMs = REQUEST_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error('Request timed out'));
    }, timeoutMs);

    promise
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timer);
        reject(error);
      });
  });
}

export function useMembershipAccess() {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [hasOwnerAccess, setHasOwnerAccess] = useState(false);
  const [isCheckingOwnerAccess, setIsCheckingOwnerAccess] = useState(false);
  const [lastKnownHasAccess, setLastKnownHasAccess] = useState(false);
  const [lastKnownOwnerAccess, setLastKnownOwnerAccess] = useState(false);

  const userEmail = session?.user?.email?.trim() ?? null;
  const isAuthenticated = Boolean(session?.user);
  const hasAccess =
    isAuthenticated &&
    Boolean(userEmail) &&
    subscriptionStatus != null &&
    ALLOWED_STATUSES.has(subscriptionStatus);

  useEffect(() => {
    if (hasAccess) {
      setLastKnownHasAccess(true);
      return;
    }

    if (!isAuthenticated) {
      setLastKnownHasAccess(false);
    }
  }, [hasAccess, isAuthenticated]);

  useEffect(() => {
    if (hasOwnerAccess) {
      setLastKnownOwnerAccess(true);
      return;
    }

    if (!isAuthenticated && !getStoredAdminToken()) {
      setLastKnownOwnerAccess(false);
    }
  }, [hasOwnerAccess, isAuthenticated]);

  const loadSubscriptionForUser = useCallback(async (user: User | null) => {
    const email = user?.email?.trim();
    if (!email) {
      setSubscriptionStatus(null);
      return;
    }

    try {
      const { data, error } = await withTimeout(
        supabase
          .from('billing_subscriptions')
          .select('status')
          .eq('customer_email', email)
          .order('updated_at', { ascending: false })
          .limit(1),
      );

      if (error) {
        setSubscriptionStatus(null);
        return;
      }

      const row = data?.[0] as { status?: string } | undefined;
      setSubscriptionStatus(row?.status ?? null);
    } catch {
      setSubscriptionStatus(null);
    }
  }, []);

  const loadOwnerAccess = useCallback(async (user: User | null) => {
    const shouldCheckOwnerAccess = Boolean(getStoredAdminToken()) || Boolean(user);
    if (!shouldCheckOwnerAccess) {
      setHasOwnerAccess(false);
      setIsCheckingOwnerAccess(false);
      return;
    }

    setIsCheckingOwnerAccess(true);
    try {
      const access = await withTimeout(checkAdminAccess());
      setHasOwnerAccess(Boolean(access?.authorized));
    } catch {
      setHasOwnerAccess(false);
    } finally {
      setIsCheckingOwnerAccess(false);
    }
  }, []);

  const refreshAccess = useCallback(async () => {
    try {
      const {
        data: { session: next },
      } = await withTimeout(supabase.auth.getSession());
      setSession(next);
      await Promise.all([
        loadSubscriptionForUser(next?.user ?? null),
        loadOwnerAccess(next?.user ?? null),
      ]);
    } catch {
      setSession(null);
      setSubscriptionStatus(null);
      setHasOwnerAccess(false);
      setIsCheckingOwnerAccess(false);
    }
  }, [loadOwnerAccess, loadSubscriptionForUser]);

  useEffect(() => {
    let cancelled = false;

    const finish = () => {
      if (!cancelled) setIsLoading(false);
    };

    const init = async () => {
      setIsLoading(true);
      try {
        const {
          data: { session: initial },
        } = await withTimeout(supabase.auth.getSession());
        if (cancelled) return;
        setSession(initial);
        await Promise.all([
          loadSubscriptionForUser(initial?.user ?? null),
          loadOwnerAccess(initial?.user ?? null),
        ]);
      } catch {
        if (cancelled) return;
        setSession(null);
        setSubscriptionStatus(null);
        setHasOwnerAccess(false);
        setIsCheckingOwnerAccess(false);
      } finally {
        finish();
      }
    };

    void init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (cancelled) return;
      try {
        setSession(nextSession);
        await Promise.all([
          loadSubscriptionForUser(nextSession?.user ?? null),
          loadOwnerAccess(nextSession?.user ?? null),
        ]);
      } catch {
        setSubscriptionStatus(null);
        setHasOwnerAccess(false);
        setIsCheckingOwnerAccess(false);
      } finally {
        finish();
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [loadOwnerAccess, loadSubscriptionForUser]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setSubscriptionStatus(null);
    setHasOwnerAccess(false);
    setIsCheckingOwnerAccess(false);
    setLastKnownHasAccess(false);
    setLastKnownOwnerAccess(false);
  }, []);

  return {
    isLoading,
    isAuthenticated,
    userEmail,
    subscriptionStatus,
    hasAccess,
    hasOwnerAccess,
    isCheckingOwnerAccess,
    lastKnownHasAccess,
    lastKnownOwnerAccess,
    refreshAccess,
    signOut,
  };
}
