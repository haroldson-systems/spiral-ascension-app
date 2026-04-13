import { useCallback, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

const ALLOWED_STATUSES = new Set(['active', 'trialing']);

export function useMembershipAccess() {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);

  const userEmail = session?.user?.email?.trim() ?? null;
  const isAuthenticated = Boolean(session?.user);
  const hasAccess =
    isAuthenticated &&
    Boolean(userEmail) &&
    subscriptionStatus != null &&
    ALLOWED_STATUSES.has(subscriptionStatus);

  const loadSubscriptionForUser = useCallback(async (user: User | null) => {
    const email = user?.email?.trim();
    if (!email) {
      setSubscriptionStatus(null);
      return;
    }

    const { data, error } = await supabase
      .from('billing_subscriptions')
      .select('status')
      .eq('customer_email', email)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error) {
      setSubscriptionStatus(null);
      return;
    }

    const row = data?.[0] as { status?: string } | undefined;
    setSubscriptionStatus(row?.status ?? null);
  }, []);

  const refreshAccess = useCallback(async () => {
    const { data: { session: next } } = await supabase.auth.getSession();
    setSession(next);
    await loadSubscriptionForUser(next?.user ?? null);
  }, [loadSubscriptionForUser]);

  useEffect(() => {
    let cancelled = false;

    const finish = () => {
      if (!cancelled) setIsLoading(false);
    };

    const init = async () => {
      setIsLoading(true);
      const { data: { session: initial } } = await supabase.auth.getSession();
      if (cancelled) return;
      setSession(initial);
      await loadSubscriptionForUser(initial?.user ?? null);
      finish();
    };

    void init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (cancelled) return;
      setSession(nextSession);
      await loadSubscriptionForUser(nextSession?.user ?? null);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [loadSubscriptionForUser]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setSubscriptionStatus(null);
  }, []);

  return {
    isLoading,
    isAuthenticated,
    userEmail,
    subscriptionStatus,
    hasAccess,
    refreshAccess,
    signOut,
  };
}
