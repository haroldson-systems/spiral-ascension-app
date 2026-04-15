import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, CreditCard } from 'lucide-react';
import { createPortalSession, fetchCheckoutSession } from '@/lib/billingApi';
import { supabase } from '@/lib/supabaseClient';

export default function CheckoutSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sessionQuery = useQuery({
    queryKey: ['checkoutSession', sessionId],
    queryFn: () => fetchCheckoutSession(sessionId!),
    enabled: Boolean(sessionId),
    retry: false,
  });

  useEffect(() => {
    let active = true;

    const syncSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (active && session) {
        navigate('/app', { replace: true });
      }
    };

    void syncSession();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active && session) {
        navigate('/app', { replace: true });
      }
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    const checkoutEmail = sessionQuery.data?.customerEmail?.trim();
    if (!checkoutEmail) return;
    setEmail(checkoutEmail);
  }, [sessionQuery.data?.customerEmail]);

  const resetFeedback = () => {
    setMessage(null);
    setError(null);
  };

  const openBillingPortal = async () => {
    if (!sessionId) return;
    try {
      setIsOpeningPortal(true);
      const { url } = await createPortalSession({
        checkoutSessionId: sessionId,
        returnUrl: `${window.location.origin}/checkout/success?session_id=${encodeURIComponent(sessionId)}`,
      });
      window.location.href = url;
    } finally {
      setIsOpeningPortal(false);
    }
  };

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    resetFeedback();

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/app`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (data.session) {
        navigate('/app');
        return;
      }

      setMessage('Check your email for the confirmation link, then you will drop into the app with this membership.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    resetFeedback();
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      navigate('/app');
    } finally {
      setLoading(false);
    }
  };

  const checkoutEmailLocked = Boolean(sessionQuery.data?.customerEmail);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0b2e] via-[#2d1b4e] to-[#1a0b2e] text-[#e8e8f0]">
      <main className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-6 py-16">
        <div className="grid w-full gap-8 rounded-3xl border border-purple-700/40 bg-purple-950/45 p-8 shadow-2xl backdrop-blur lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-6">
            <CheckCircle2 className="h-14 w-14 text-emerald-300" />
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.4em] text-purple-300">Payment Captured</p>
              <h1 className="text-4xl font-bold text-white">Your trial has begun.</h1>
              <p className="text-lg leading-relaxed text-purple-100/85">
                Your card is on file. One more step remains: create or sign into the app account that matches this
                checkout email.
              </p>
            </div>

            <div className="rounded-2xl border border-purple-700/40 bg-[#1f1038]/70 p-5 text-sm text-purple-100/85">
              {sessionQuery.isPending ? (
                <p>Checking your checkout details...</p>
              ) : sessionQuery.isError ? (
                <p>We could not load the Stripe session details, but the checkout itself completed.</p>
              ) : (
                <div className="space-y-2">
                  <p>
                    <span className="font-semibold text-white">Checkout email:</span>{' '}
                    {sessionQuery.data?.customerEmail ?? 'Captured in Stripe'}
                  </p>
                  <p>
                    <span className="font-semibold text-white">Session:</span> {sessionQuery.data?.sessionId}
                  </p>
                  <p>
                    <span className="font-semibold text-white">Status:</span> {sessionQuery.data?.status ?? 'complete'}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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
              <Link
                to="/auth/forgot"
                className="inline-flex items-center justify-center rounded-lg border border-purple-500/40 px-5 py-3 font-semibold text-purple-100 transition hover:bg-purple-900/50"
              >
                Forgot password
              </Link>
            </div>
          </section>

          <section className="rounded-3xl border border-purple-700/40 bg-[#180c2c]/70 p-6">
            <div className="mb-6 flex rounded-lg border border-purple-600/40 bg-[#12081f]/60 p-1 text-sm font-semibold">
              <button
                type="button"
                className={`flex-1 rounded-md py-2 transition ${
                  mode === 'signup' ? 'bg-purple-700 text-white shadow' : 'text-purple-200 hover:text-white'
                }`}
                onClick={() => {
                  setMode('signup');
                  resetFeedback();
                }}
              >
                Create account
              </button>
              <button
                type="button"
                className={`flex-1 rounded-md py-2 transition ${
                  mode === 'signin' ? 'bg-purple-700 text-white shadow' : 'text-purple-200 hover:text-white'
                }`}
                onClick={() => {
                  setMode('signin');
                  resetFeedback();
                }}
              >
                Sign in
              </button>
            </div>

            <p className="mb-5 text-sm leading-relaxed text-purple-100/85">
              {mode === 'signup'
                ? 'Create your app password. If email confirmation is enabled, a confirmation email will be sent after this step.'
                : 'Already created your account? Sign in with the same email you used during checkout.'}
            </p>

            <form onSubmit={mode === 'signup' ? handleSignUp : handleSignIn} className="space-y-4">
              <div>
                <label htmlFor="checkout-email" className="mb-1 block text-sm font-medium text-purple-200">
                  Email
                </label>
                <input
                  id="checkout-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  readOnly={checkoutEmailLocked}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-purple-600/50 bg-[#12081f]/80 px-4 py-3 text-white placeholder:text-purple-400/60 focus:border-[#d4af37] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/30 read-only:cursor-not-allowed read-only:opacity-80"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="checkout-password" className="mb-1 block text-sm font-medium text-purple-200">
                  Password
                </label>
                <input
                  id="checkout-password"
                  type="password"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-purple-600/50 bg-[#12081f]/80 px-4 py-3 text-white placeholder:text-purple-400/60 focus:border-[#d4af37] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/30"
                  placeholder="••••••••"
                />
              </div>

              {mode === 'signup' ? (
                <div>
                  <label htmlFor="checkout-confirm-password" className="mb-1 block text-sm font-medium text-purple-200">
                    Confirm password
                  </label>
                  <input
                    id="checkout-confirm-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-lg border border-purple-600/50 bg-[#12081f]/80 px-4 py-3 text-white placeholder:text-purple-400/60 focus:border-[#d4af37] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/30"
                    placeholder="••••••••"
                  />
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg border-2 border-[#d4af37] bg-gradient-to-r from-purple-700 to-purple-900 px-6 py-3 font-semibold text-white shadow-lg shadow-purple-900/40 transition hover:from-purple-600 hover:to-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Please wait…' : mode === 'signup' ? 'Create account and send confirmation' : 'Sign in'}
              </button>
            </form>

            {error ? (
              <p className="mt-4 text-sm text-red-300" role="alert">
                {error}
              </p>
            ) : null}
            {message ? (
              <p className="mt-4 text-sm text-purple-100/90" role="status">
                {message}
              </p>
            ) : null}
          </section>
        </div>
      </main>
    </div>
  );
}
