import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [canReset, setCanReset] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const syncSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) return;

      setCanReset(Boolean(session));
      setEmail(session?.user?.email?.trim() ?? null);
      setReady(true);
    };

    void syncSession();

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if (event === 'INITIAL_SESSION' || event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setCanReset(Boolean(session));
        setEmail(session?.user?.email?.trim() ?? null);
        setReady(true);
      }
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

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
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setMessage('Password updated. Sending you back into the Spiral…');
      window.setTimeout(() => {
        navigate('/app');
      }, 1200);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0b2e] via-[#3a2563] to-[#1a0b2e] text-white">
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
        <div className="rounded-3xl border border-purple-700/40 bg-purple-950/40 p-8 shadow-2xl backdrop-blur">
          <h1 className="mb-2 text-center text-3xl font-bold tracking-tight text-white">Choose a new password</h1>

          {!ready ? (
            <p className="mt-4 text-center text-sm text-purple-200/90">Preparing your secure reset link…</p>
          ) : !canReset ? (
            <>
              <p className="mt-4 text-center text-sm leading-relaxed text-purple-200/90">
                This reset link is missing, expired, or has already been used.
              </p>
              <p className="mt-6 text-center text-sm text-purple-200/85">
                <Link to="/auth/forgot" className="font-semibold text-[#d4af37] underline-offset-4 hover:underline">
                  Request a fresh reset email
                </Link>
              </p>
            </>
          ) : (
            <>
              <p className="mb-6 text-center text-sm leading-relaxed text-purple-200/90">
                {email ? `Resetting password for ${email}.` : 'Enter your new password below.'}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="reset-password" className="mb-1 block text-sm font-medium text-purple-200">
                    New password
                  </label>
                  <input
                    id="reset-password"
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
                  <label htmlFor="reset-confirm-password" className="mb-1 block text-sm font-medium text-purple-200">
                    Confirm new password
                  </label>
                  <input
                    id="reset-confirm-password"
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
                  disabled={loading}
                  className="w-full rounded-lg border-2 border-[#d4af37] bg-gradient-to-r from-purple-700 to-purple-900 px-6 py-3 font-semibold text-white shadow-lg shadow-purple-900/40 transition hover:from-purple-600 hover:to-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Updating…' : 'Update password'}
                </button>
              </form>
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
