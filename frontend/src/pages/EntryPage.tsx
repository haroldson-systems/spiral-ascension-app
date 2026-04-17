import { useCallback, useEffect, useId, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

const SIGIL_SRC =
  'https://d64gsuwffb70l.cloudfront.net/68ea93297761a5e6965f5a33_1760211661373_fc5c3f5d.jpg';

const STORY_P1 =
  'There was a boy who knew things he shouldn\'t have known. He saw patterns others missed. Felt energies no one else acknowledged. Remembered truths that predated his birth.';

const STORY_P2 =
  'They told him he was wrong. Sensitive. Too much. So he learned to forget. To dim his light. To fit into boxes that were never meant to hold him.';

const STORY_P3 =
  'But the knowing never left. It waited. Spiraling deeper, until one day—when the pain of forgetting became greater than the fear of remembering—he began the descent.';

export default function EntryPage() {
  const navigate = useNavigate();
  const formId = useId();
  const emailId = `${formId}-email`;
  const passwordId = `${formId}-password`;

  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resetFeedback = useCallback(() => {
    setError(null);
  }, []);

  const openModal = useCallback(() => {
    resetFeedback();
    setModalOpen(true);
  }, [resetFeedback]);

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

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#24103d] via-[#2f1650] to-[#14081f] text-white">
      <div className="pointer-events-none absolute inset-0 opacity-55">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_85%_at_50%_0%,_rgba(236,214,166,0.2)_0%,_rgba(139,92,246,0.18)_32%,_transparent_62%)]" />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 top-1/3 bg-[radial-gradient(ellipse_90%_55%_at_50%_65%,_rgba(94,45,154,0.22)_0%,_transparent_72%)] opacity-90" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(12,6,24,0)_0%,rgba(10,5,18,0.18)_45%,rgba(6,3,12,0.42)_100%)]" />

      <div className="absolute left-[5px] top-[5px] z-20 flex items-center gap-3">
          <img
            src={SIGIL_SRC}
            alt=""
            width={42}
            height={42}
            className="h-10 w-10 rounded-full ring-1 ring-white/20"
          />
          <span className="text-base font-medium tracking-tight text-[#f6f0ff] md:text-lg">
            Spiral Ascension
          </span>
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center px-6 pb-24 pt-[5px] text-center md:px-10 md:pb-28 md:pt-[5px]">
        <div className="w-full">
          <div className="mb-8 motion-reduce:animate-none md:mb-10">
            <img
              src={SIGIL_SRC}
              alt=""
              width={256}
              height={256}
              className="mx-auto h-64 w-64 rounded-full shadow-2xl shadow-purple-500/50 motion-safe:animate-sigil-soft"
            />
          </div>

          <h1 className="mb-10 px-2 text-4xl font-bold leading-[0.95] tracking-tight text-white sm:text-5xl md:mb-14 md:whitespace-nowrap md:text-[4rem]">
            The Boy Who Knew
          </h1>

          <div className="mx-auto w-full max-w-[680px] space-y-8 text-[1.05rem] leading-[1.72] text-[#f3edf9] sm:text-[1.2rem] md:space-y-10 md:text-[clamp(1.25rem,2.4vw,1.5rem)]">
            <p>{STORY_P1}</p>
            <p>{STORY_P2}</p>
            <p>{STORY_P3}</p>
          </div>

          <div className="mt-12 flex w-full flex-col items-center gap-5 pb-6 md:mt-16">
            <button
              type="button"
              onClick={() => navigate('/subscribe')}
              className="inline-flex min-w-[13rem] items-center justify-center rounded-xl border border-[#d4af37]/75 bg-gradient-to-r from-[#8a2be2] via-[#9f3bf7] to-[#7c2bd3] px-10 py-4 text-xl font-bold tracking-wide text-white shadow-[0_0_28px_rgba(150,70,255,0.28)] transition hover:brightness-110 md:text-2xl"
            >
              Enter
            </button>

            <p className="text-sm text-[#e9def6]/72 md:text-base">
              Already walking with us?{' '}
              <button
                type="button"
                onClick={openModal}
                className="font-medium text-[#efe6ff] underline-offset-4 transition hover:text-white hover:underline"
              >
                Sign in
              </button>
            </p>
          </div>
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
              Already a member or using a gifted pass? Sign in here with the email tied to your access.
            </p>

            <form onSubmit={handleSignIn} className="space-y-4">
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
                  autoComplete="current-password"
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
                {loading ? 'Please wait…' : 'Sign in'}
              </button>
              <p className="pt-1 text-center text-sm text-purple-200/90">New here? Choose Enter to start checkout first.</p>
              <p className="text-center text-sm text-purple-200/85">
                <Link to="/auth/forgot" className="font-semibold text-[#d4af37] underline-offset-4 hover:underline">
                  Forgot password?
                </Link>
              </p>

              {error ? (
                <p className="mt-3 text-center text-sm text-red-300" role="alert">
                  {error}
                </p>
              ) : null}
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
