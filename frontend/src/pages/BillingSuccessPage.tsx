import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, CreditCard } from 'lucide-react';
import {
  createPortalSession,
  fetchCheckoutSession,
} from '@/lib/billingApi';

export default function BillingSuccessPage() {
  const [searchParams] = useSearchParams();
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const sessionId = searchParams.get('session_id');
  const sessionQuery = useQuery({
    queryKey: ['checkoutSession', sessionId],
    queryFn: () => fetchCheckoutSession(sessionId!),
    enabled: Boolean(sessionId),
    retry: false,
  });

  const openBillingPortal = async () => {
    if (!sessionId) return;
    try {
      setIsOpeningPortal(true);
      const { url } = await createPortalSession({
        checkoutSessionId: sessionId,
        returnUrl: `${window.location.origin}/billing/success?session_id=${encodeURIComponent(sessionId)}`,
      });
      window.location.href = url;
    } finally {
      setIsOpeningPortal(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0b2e] via-[#3a2563] to-[#1a0b2e] text-white">
      <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6 py-16">
        <div className="w-full rounded-3xl border border-purple-700/40 bg-purple-950/45 p-8 shadow-2xl backdrop-blur">
          <div className="space-y-6 text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-300" />
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.4em] text-purple-300">Enrollment Complete</p>
              <h1 className="text-4xl font-bold text-white">Your first week is active.</h1>
              <p className="text-lg text-purple-100/85">
                Your payment method is on file, your trial has started, and monthly billing will begin automatically unless you cancel first. Next, sign in with the same email so the app can unlock your membership.
              </p>
            </div>

            {sessionId ? (
              <div className="rounded-2xl border border-purple-700/40 bg-[#1f1038]/70 p-5 text-left text-sm text-purple-100/85">
                {sessionQuery.isPending ? (
                  <p>Checking your checkout details...</p>
                ) : sessionQuery.isError ? (
                  <p>We could not load checkout details, but your Stripe session completed.</p>
                ) : (
                  <div className="space-y-2">
                    <p>
                      <span className="font-semibold text-white">Email:</span>{' '}
                      {sessionQuery.data?.customerEmail ?? 'Captured in Stripe'}
                    </p>
                    <p>
                      <span className="font-semibold text-white">Session:</span>{' '}
                      {sessionQuery.data?.sessionId}
                    </p>
                    <p>
                      <span className="font-semibold text-white">Status:</span>{' '}
                      {sessionQuery.data?.status ?? 'complete'}
                    </p>
                  </div>
                )}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                to="/auth"
                className="inline-flex items-center justify-center rounded-lg bg-purple-600 px-5 py-3 font-semibold text-white transition hover:bg-purple-500"
              >
                Sign in or create account
              </Link>
              {sessionId ? (
                <button
                  type="button"
                  onClick={openBillingPortal}
                  disabled={isOpeningPortal}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-purple-500/40 px-5 py-3 font-semibold text-purple-100 transition hover:bg-purple-900/50 disabled:opacity-60"
                >
                  <CreditCard className="h-4 w-4" />
                  {isOpeningPortal ? 'Opening billing...' : 'Manage Billing'}
                </button>
              ) : null}
            </div>

            <p className="text-sm text-purple-200/80">
              Need to cancel before billing starts? Use <span className="font-semibold text-white">Manage Billing</span>.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
