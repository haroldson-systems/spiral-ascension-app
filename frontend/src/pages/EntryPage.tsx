import { useCallback, useEffect, useId, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

const SIGIL_SRC =
  'https://d64gsuwffb70l.cloudfront.net/68ea93297761a5e6965f5a33_1760211661373_fc5c3f5d.jpg';

const STORY_P1 =
  'There was a boy who knew things he shouldn\'t have known. He saw patterns others missed. Felt energies no one else acknowledged. Remembered truths that predated his birth.';

const STORY_P2 =
  'They told him he was wrong. Sensitive. Too much. So he learned to forget. To dim his light. To fit into boxes that were never meant to hold him.';

const STORY_P3 =
  'But the knowing never left. It waited. Spiraling deeper, until one day—when the pain of forgetting became greater than the fear of remembering—he began the descent.';

type AuthMode = 'signin' | 'signup';

export default function EntryPage() {
  const navigate = useNavigate();
  const formId = useId();
  const emailId = `${formId}-email`;
  const passwordId = `${formId}-password`;

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resetFeedback = useCallback(() => {
    setMessage(null);
    setError(null);
  }, []);

  const openModal = useCallback(
    (nextMode: AuthMode) => {
      resetFeedback();
      setMode(nextMode);
      setModalOpen(true);
    },
    [resetFeedback],
  );

  const closeModal = useCallback(() => {
    setModalOpen(false);
    resetFeedback();
  }, [resetFeedback]);

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalOpen, closeModal]);

  useEffect(() => {
    if (!modalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [modalOpen]);

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
      closeModal();
      navigate('/app');
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
        closeModal();
        navigate('/subscribe');
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
    <div className="relative min-h-screen bg-gradient-to-b from-[#3a2563] via-[#2d1b4e] to-[#0f0618] text-white">
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_0%,_#8b5cf6_0%,_transparent_55%)]" />
      </div>

      <main className="relative z-10 mx-auto flex max-w-[700px] flex-col items-center px-6 pb-24 pt-20 text-center md:pt-24">
        <div className="mb-10 motion-reduce:animate-none">
          <img
            src={SIGIL_SRC}
            alt=""
            width={224}
            height={224}
            className="mx-auto h-52 w-52 rounded-full shadow-2xl shadow-purple-600/30 ring-1 ring-[#d4af37]/25 motion-safe:animate-sigil-soft md:h-56 md:w-56"
          />
        </div>

        <h1 className="mb-20 text-5xl font-bold tracking-tight text-[#f5f3ff] md:text-6xl">
          The Boy Who Knew
        </h1>

        <div className="w-full space-y-10 text-xl leading-[1.75] text-white/85 md:text-2xl">
          <p>{STORY_P1}</p>
          <p>{STORY_P2}</p>
          <p>{STORY_P3}</p>
        </div>

        <div className="mt-14 flex w-full flex-col items-center gap-8">
          <button
            type="button"
            onClick={() => openModal('signup')}
            className="inline-flex min-w-[12rem] items-center justify-center rounded-lg border-2 border-[#d4af37]/80 bg-gradient-to-r from-purple-700 to-purple-900 px-10 py-4 text-lg font-semibold tracking-wide text-white shadow-lg shadow-purple-900/40 transition hover:from-purple-600 hover:to-purple-800"
          >
            Enter
          </button>

          <p className="text-sm text-white/65">
            Already walking with us?{' '}
            <button
              type="button"
              onClick={() => openModal('signin')}
              className="font-medium text-[#e8d5a3] underline-offset-4 transition hover:text-[#f5ebd4] hover:underline"
            >
              Sign in
            </button>
          </p>
        </div>
      </main>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close dialog"
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${formId}-dialog-title`}
            className="relative z-10 w-full max-w-md rounded-3xl border border-purple-700/40 bg-purple-950/40 p-8 shadow-2xl backdrop-blur"
          >
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-4 top-4 rounded-md px-2 py-1 text-sm font-medium text-purple-200/90 transition hover:bg-purple-900/50 hover:text-white"
            >
              Close
            </button>

            <h2 id={`${formId}-dialog-title`} className="mb-2 pr-10 text-center text-2xl font-bold tracking-tight text-white">
              Account access
            </h2>
            <p className="mb-6 text-center text-sm text-purple-200/90">
              Same email as checkout helps your subscription unlock the app.
            </p>

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
                Sign up
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

            <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="space-y-4">
              <div>
                <label htmlFor={emailId} className="mb-1 block text-sm font-medium text-purple-200">
                  Email
                </label>
                <input
                  id={emailId}
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
                <label htmlFor={passwordId} className="mb-1 block text-sm font-medium text-purple-200">
                  Password
                </label>
                <input
                  id={passwordId}
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
                {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Begin'}
              </button>
              <p className="pt-1 text-center text-sm text-purple-200/90">7 days free. Then $3.33/month.</p>

              {error ? (
                <p className="mt-3 text-center text-sm text-red-300" role="alert">
                  {error}
                </p>
              ) : null}
              {message ? (
                <p className="mt-3 text-center text-sm text-purple-100/90" role="status">
                  {message}
                </p>
              ) : null}
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
