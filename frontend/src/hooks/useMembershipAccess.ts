import { useCallback, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { checkAdminAccess, getStoredAdminToken } from '@/lib/adminApi';

const ALLOWED_STATUSES = new Set(['active', 'trialing']);
const REQUEST_TIMEOUT_MS = 8000;
const TRUSTED_ACCESS_CACHE_KEY = 'trustedMembershipAccess';

interface TrustedAccessCache {
  email: string;
  updatedAt: number;
}

interface SubscriptionCheckResult {
  status: string | null;
  ok: boolean;
}

interface OwnerAccessCheckResult {
  authorized: boolean;
  ok: boolean;
}

function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() ?? null;
}

function readTrustedAccessCache(): TrustedAccessCache | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(TRUSTED_ACCESS_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<TrustedAccessCache>;
    if (typeof parsed.email !== 'string' || !parsed.email.trim()) {
      return null;
    }

    return {
      email: parsed.email.trim().toLowerCase(),
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

function saveTrustedAccessCache(email: string) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(
      TRUSTED_ACCESS_CACHE_KEY,
      JSON.stringify({
        email: email.trim().toLowerCase(),
        updatedAt: Date.now(),
      } satisfies TrustedAccessCache),
    );
  } catch {
    // Ignore storage failures and fall back to in-memory behavior.
  }
}

function clearTrustedAccessCache(expectedEmail?: string | null) {
  if (typeof window === 'undefined') return;

  try {
    if (!expectedEmail) {
      window.localStorage.removeItem(TRUSTED_ACCESS_CACHE_KEY);
      return;
    }

    const cached = readTrustedAccessCache();
    if (cached?.email === expectedEmail.trim().toLowerCase()) {
      window.localStorage.removeItem(TRUSTED_ACCESS_CACHE_KEY);
    }
  } catch {
    // Ignore storage failures and fall back to in-memory behavior.
  }
}

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
  const [isRefreshingAccess, setIsRefreshingAccess] = useState(false);
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
      if (userEmail) {
        saveTrustedAccessCache(userEmail);
      }
      return;
    }

    if (!isAuthenticated) {
      setLastKnownHasAccess(false);
    }
  }, [hasAccess, isAuthenticated]);

  useEffect(() => {
    if (hasOwnerAccess) {
      setLastKnownOwnerAccess(true);
      if (userEmail) {
        saveTrustedAccessCache(userEmail);
      }
      return;
    }

    if (!isAuthenticated && !getStoredAdminToken()) {
      setLastKnownOwnerAccess(false);
    }
  }, [hasOwnerAccess, isAuthenticated, userEmail]);

  const hydrateTrustedAccess = useCallback((user: User | null) => {
    const email = normalizeEmail(user?.email);
    const cached = readTrustedAccessCache();

    if (email && cached?.email === email) {
      setLastKnownHasAccess(true);
      return;
    }

    setLastKnownHasAccess(false);
    if (!getStoredAdminToken()) {
      setLastKnownOwnerAccess(false);
    }
  }, []);

  const loadSubscriptionForUser = useCallback(async (user: User | null): Promise<SubscriptionCheckResult> => {
    const email = user?.email?.trim();
    if (!email) {
      setSubscriptionStatus(null);
      return { status: null, ok: true };
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
        return { status: null, ok: false };
      }

      const row = data?.[0] as { status?: string } | undefined;
      const status = row?.status ?? null;
      setSubscriptionStatus(status);
      return { status, ok: true };
    } catch {
      setSubscriptionStatus(null);
      return { status: null, ok: false };
    }
  }, []);

  const loadOwnerAccess = useCallback(async (user: User | null): Promise<OwnerAccessCheckResult> => {
    const shouldCheckOwnerAccess = Boolean(getStoredAdminToken()) || Boolean(user);
    if (!shouldCheckOwnerAccess) {
      setHasOwnerAccess(false);
      setIsCheckingOwnerAccess(false);
      return { authorized: false, ok: true };
    }

    setIsCheckingOwnerAccess(true);
    try {
      const access = await withTimeout(checkAdminAccess());
      const authorized = Boolean(access?.authorized);
      setHasOwnerAccess(authorized);
      return { authorized, ok: true };
    } catch {
      setHasOwnerAccess(false);
      return { authorized: false, ok: false };
    } finally {
      setIsCheckingOwnerAccess(false);
    }
  }, []);

  const resolveAccess = useCallback(
    async (user: User | null) => {
      const email = normalizeEmail(user?.email);
      const shouldCheckOwnerAccess = Boolean(getStoredAdminToken()) || Boolean(user);

      if (!user && !shouldCheckOwnerAccess) {
        setIsRefreshingAccess(false);
        setSubscriptionStatus(null);
        setHasOwnerAccess(false);
        setLastKnownHasAccess(false);
        setLastKnownOwnerAccess(false);
        clearTrustedAccessCache();
        return;
      }

      setIsRefreshingAccess(true);
      try {
        const [subscriptionResult, ownerResult] = await Promise.all([
          loadSubscriptionForUser(user),
          loadOwnerAccess(user),
        ]);

        const nextHasMembership =
          subscriptionResult.ok &&
          Boolean(subscriptionResult.status) &&
          ALLOWED_STATUSES.has(subscriptionResult.status);

        if (subscriptionResult.ok) {
          setLastKnownHasAccess(nextHasMembership);
        }

        if (ownerResult.ok || !getStoredAdminToken()) {
          setLastKnownOwnerAccess(ownerResult.authorized);
        }

        if (email && (nextHasMembership || (ownerResult.ok && ownerResult.authorized))) {
          saveTrustedAccessCache(email);
          return;
        }

        if (
          email &&
          subscriptionResult.ok &&
          ownerResult.ok &&
          !nextHasMembership &&
          !ownerResult.authorized
        ) {
          clearTrustedAccessCache(email);
        }
      } finally {
        setIsRefreshingAccess(false);
      }
    },
    [loadOwnerAccess, loadSubscriptionForUser],
  );

  const refreshAccess = useCallback(async () => {
    try {
      const {
        data: { session: next },
      } = await withTimeout(supabase.auth.getSession());
      setSession(next);
      hydrateTrustedAccess(next?.user ?? null);
      await resolveAccess(next?.user ?? null);
    } catch {
      setSession(null);
      setSubscriptionStatus(null);
      setHasOwnerAccess(false);
      setIsCheckingOwnerAccess(false);
      setIsRefreshingAccess(false);
    }
  }, [hydrateTrustedAccess, resolveAccess]);

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
        hydrateTrustedAccess(initial?.user ?? null);
        finish();
        void resolveAccess(initial?.user ?? null);
      } catch {
        if (cancelled) return;
        setSession(null);
        setSubscriptionStatus(null);
        setHasOwnerAccess(false);
        setIsCheckingOwnerAccess(false);
        finish();
      }
    };

    void init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (cancelled) return;
      setSession(nextSession);
      hydrateTrustedAccess(nextSession?.user ?? null);

      if (!nextSession?.user && !getStoredAdminToken()) {
        setSubscriptionStatus(null);
        setHasOwnerAccess(false);
        setIsCheckingOwnerAccess(false);
        setIsRefreshingAccess(false);
        setLastKnownHasAccess(false);
        setLastKnownOwnerAccess(false);
        clearTrustedAccessCache();
        finish();
        return;
      }

      finish();
      void resolveAccess(nextSession?.user ?? null);
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
    setIsRefreshingAccess(false);
    setLastKnownHasAccess(false);
    setLastKnownOwnerAccess(false);
    clearTrustedAccessCache(userEmail);
  }, []);

  return {
    isLoading,
    isRefreshingAccess,
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
