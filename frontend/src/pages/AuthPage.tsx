import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

type AuthMode = 'signin' | 'signup';

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resetFeedback = () => {
    setMessage(null);
    setError(null);
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
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    resetFeedback();
    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      if (data.session) {
        navigate('/');
        return;
      }
      setMessage(
        'Check your email for a confirmation link if your project requires it. After confirming, sign in here.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0b2e] via-[#3a2563] to-[#1a0b2e] text-white">
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
        <div className="rounded-3xl border border-purple-700/40 bg-purple-950/40 p-8 shadow-2xl backdrop-blur">
          <h1 className="mb-2 text-center text-3xl font-bold tracking-tight text-white">Account access</h1>
          <p className="mb-6 text-center text-sm text-purple-200/90">
            Same email as checkout helps your subscription unlock the app.
          </p>

          <div className="mb-6 flex rounded-lg border border-purple-600/40 bg-[#12081f]/60 p-1 text-sm font-semibold">
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
          </div>

          <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="space-y-4">
            <div>
              <label htmlFor="auth-email" className="mb-1 block text-sm font-medium text-purple-200">
                Email
              </label>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-purple-600/50 bg-[#12081f]/80 px-4 py-3 text-white placeholder:text-purple-400/60 focus:border-[#d4af37] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/30"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="auth-password" className="mb-1 block text-sm font-medium text-purple-200">
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-purple-600/50 bg-[#12081f]/80 px-4 py-3 text-white placeholder:text-purple-400/60 focus:border-[#d4af37] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/30"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg border-2 border-[#d4af37] bg-gradient-to-r from-purple-700 to-purple-900 px-6 py-3 font-semibold text-white shadow-lg shadow-purple-900/40 transition hover:from-purple-600 hover:to-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>

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

          <p className="mt-8 text-center text-sm text-purple-200/85">
            Need a membership?{' '}
            <Link to="/subscribe" className="font-semibold text-[#d4af37] underline-offset-4 hover:underline">
              Subscribe
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
