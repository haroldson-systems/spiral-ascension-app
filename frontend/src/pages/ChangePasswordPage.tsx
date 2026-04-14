import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

export default function ChangePasswordPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadSession = async () => {
      const {
        data: { session: nextSession },
      } = await supabase.auth.getSession();

      if (!active) return;

      setSession(nextSession);
      setIsLoadingSession(false);
    };

    void loadSession();

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setIsLoadingSession(false);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSaving(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setPassword('');
      setConfirmPassword('');
      setMessage('Password updated.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#12081f] via-[#24123f] to-[#12081f] text-white">
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
        <div className="rounded-3xl border border-purple-700/40 bg-purple-950/40 p-8 shadow-2xl backdrop-blur">
          <h1 className="mb-2 text-center text-3xl font-bold tracking-tight text-white">Change password</h1>

          {isLoadingSession ? (
            <p className="mt-4 text-center text-sm text-purple-200/90">Checking your session…</p>
          ) : !session?.user ? (
            <>
              <p className="mt-4 text-center text-sm leading-relaxed text-purple-200/90">
                Sign in first, then come back here to change your password.
              </p>
              <p className="mt-6 text-center text-sm text-purple-200/85">
                <Link to="/auth" className="font-semibold text-[#d4af37] underline-offset-4 hover:underline">
                  Go to sign in
                </Link>
              </p>
            </>
          ) : (
            <>
              <p className="mb-6 text-center text-sm leading-relaxed text-purple-200/90">
                Signed in as <span className="font-semibold text-white">{session.user.email}</span>
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="change-password" className="mb-1 block text-sm font-medium text-purple-200">
                    New password
                  </label>
                  <input
                    id="change-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-purple-600/50 bg-[#12081f]/80 px-4 py-3 text-white placeholder:text-purple-400/60 focus:border-[#d4af37] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/30"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label htmlFor="change-confirm-password" className="mb-1 block text-sm font-medium text-purple-200">
                    Confirm new password
                  </label>
                  <input
                    id="change-confirm-password"
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

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full rounded-lg border-2 border-[#d4af37] bg-gradient-to-r from-purple-700 to-purple-900 px-6 py-3 font-semibold text-white shadow-lg shadow-purple-900/40 transition hover:from-purple-600 hover:to-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? 'Saving…' : 'Save new password'}
                </button>
              </form>

              <div className="mt-6 flex items-center justify-between gap-4 text-sm text-purple-200/85">
                <Link to="/app" className="font-semibold text-[#d4af37] underline-offset-4 hover:underline">
                  Back to app
                </Link>
                <button
                  type="button"
                  onClick={() => void supabase.auth.signOut()}
                  className="font-semibold text-[#d4af37] underline-offset-4 hover:underline"
                >
                  Sign out
                </button>
              </div>
            </>
          )}

          {error ? (
            <p className="mt-4 text-center text-sm text-red-300" role="alert">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="mt-4 text-center text-sm text-purple-100/90" role="status">
              {message}
            </p>
          ) : null}
        </div>
      </main>
    </div>
  );
}
