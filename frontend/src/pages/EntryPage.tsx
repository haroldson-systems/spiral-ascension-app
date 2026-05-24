import { useCallback, useEffect, useId, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

/* ─── CDN assets ─── */
const CDN = 'https://d64gsuwffb70l.cloudfront.net';
const SIGIL_SRC = `${CDN}/68ea93297761a5e6965f5a33_1760211661373_fc5c3f5d.jpg`;

const IMG = {
  referenceLibrary: `${CDN}/68eab2d3d61e95e3442aaaf8_1760211754406_fad2628b.webp`,
  vortex:           `${CDN}/68eab2d3d61e95e3442aaaf8_1760211741764_51e733b6.webp`,
  helix:            `${CDN}/68eab2d3d61e95e3442aaaf8_1760211743502_6ba5fae2.webp`,
  fractal:          `${CDN}/68eab2d3d61e95e3442aaaf8_1760211745366_22c16c09.webp`,
  breathwork:       `${CDN}/68eab2d3d61e95e3442aaaf8_1760211749211_e613c756.webp`,
  resonanceGate:    `${CDN}/68eab2d3d61e95e3442aaaf8_1760211750962_dca28c92.webp`,
  fieldNotes:       `${CDN}/68eab2d3d61e95e3442aaaf8_1760211752679_be07d31e.webp`,
  moonNew:          `${CDN}/68eab2d3d61e95e3442aaaf8_1760211757131_666f8d0f.webp`,
  moonWaxing:       `${CDN}/68eab2d3d61e95e3442aaaf8_1760211758963_c20944e6.webp`,
  moonFull:         `${CDN}/68eab2d3d61e95e3442aaaf8_1760211760742_1daffb7a.webp`,
  moonWaning:       `${CDN}/68eab2d3d61e95e3442aaaf8_1760211762473_2451863d.webp`,
};

/* ─── Story text ─── */
const STORY_P1 = "There was a boy who knew things he shouldn't have known. He saw patterns others missed. Felt energies no one else acknowledged. Remembered truths that predated his birth.";
const STORY_P2 = 'They told him he was wrong. Sensitive. Too much. So he learned to forget. To dim his light. To fit into boxes that were never meant to hold him.';
const STORY_P3 = 'But the knowing never left. It waited. Spiraling deeper, until one day—when the pain of forgetting became greater than the fear of remembering—he began the descent.';

/* ─── Feature data ─── */
interface Feature {
  label: string;
  title: ReactNode;
  desc: string;
  bullets: string[];
  visual: ReactNode;
  reversed?: boolean;
}

const FEATURES: Feature[] = [
  {
    label: 'The Spiral Library',
    title: <>Seven Hermetic Principles.<br />Three Ascending Paths.</>,
    desc: 'Journey through 21 modules across Initiate, Apprentice, and Adept tiers — each built on the timeless Hermetic laws. Each Spiral module is tuned to its own Solfeggio frequency.',
    bullets: [
      'Prologue origin story — "The Boy Who Knew"',
      '7 principles × 3 tiers of deepening mastery',
      'Solfeggio frequency tones paired with each module',
    ],
    visual: (
      <div className="relative">
        <div className="absolute -right-12 -top-12 h-72 w-72 rounded-full bg-purple-600/20 blur-[120px]" />
        <div className="relative overflow-hidden rounded-2xl border border-purple-500/15 shadow-[0_25px_60px_rgba(0,0,0,0.5),0_0_100px_rgba(107,70,193,0.12)]">
          <img src={IMG.referenceLibrary} alt="Spiral Library" className="block w-full rounded-2xl" loading="lazy" />
        </div>
      </div>
    ),
  },
  {
    label: 'Ascension Practices',
    title: <>Breathwork as<br />Sacred Technology.</>,
    desc: 'Advanced somatic protocols designed for shadow work, nervous system regulation, and energetic activation. Grounding. Release. Clarity. Integration. Activation.',
    bullets: [
      '10 breathwork practices across 5 categories',
      'Guided protocols from beginner to advanced',
      'Somatic rituals for transmuting shadow into force',
    ],
    reversed: true,
    visual: (
      <div className="relative">
        <div className="absolute -bottom-12 -left-12 h-72 w-72 rounded-full bg-purple-900/30 blur-[120px]" />
        <div className="relative grid grid-cols-2 gap-3">
          {[IMG.vortex, IMG.helix, IMG.fractal, IMG.breathwork].map((src, i) => (
            <img key={i} src={src} alt="" className="aspect-square w-full rounded-xl border border-purple-500/15 object-cover shadow-[0_8px_30px_rgba(0,0,0,0.4)]" loading="lazy" />
          ))}
        </div>
      </div>
    ),
  },
  {
    label: 'MoonSync',
    title: <>Align Your Practice<br />to the Cosmos.</>,
    desc: 'A real-time lunar tracker that syncs your spiritual practice with moon phases and Kundalini energy. Set intentions on the New Moon. Release on the Full Moon. Let the cosmos guide your cadence.',
    bullets: [
      'Live moon phase tracking with ritual guidance',
      'Kundalini energy alignment by lunar cycle',
      'Moon sign insights for deeper self-awareness',
    ],
    visual: (
      <div className="relative py-10 text-center">
        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d4af37]/15 blur-[120px]" />
        <div className="relative flex justify-center gap-4">
          {[IMG.moonNew, IMG.moonWaxing, IMG.moonFull, IMG.moonWaning].map((src, i) => (
            <img key={i} src={src} alt="" className="h-[90px] w-[90px] rounded-full border border-[#d4af37]/25 shadow-[0_0_30px_rgba(107,70,193,0.3)]" loading="lazy" />
          ))}
        </div>
        <p className="mt-5 font-['Cinzel',serif] text-xs tracking-[0.1em] text-white/40">
          New Moon → Waxing → Full Moon → Waning
        </p>
      </div>
    ),
  },
  {
    label: 'The Vault',
    title: <>Your Inner<br />Sanctuary.</>,
    desc: 'A private journaling space for reflection, integration, and free-form writing. Two modes: Spiral Notes tied to each module, and Personal Writings for anything on your mind. Rich text. Search. Export. No judgment. No rush.',
    bullets: [
      'Module-linked notes that sync with your Spiral journey',
      'Free-form personal journal with rich text editor',
      'Search, tag, and export your reflections anytime',
    ],
    reversed: true,
    visual: (
      <div className="relative">
        <div className="absolute -left-8 -top-8 h-72 w-72 rounded-full bg-purple-900/25 blur-[120px]" />
        <div className="relative overflow-hidden rounded-2xl border border-purple-500/15 shadow-[0_25px_60px_rgba(0,0,0,0.5),0_0_100px_rgba(107,70,193,0.12)]">
          <img src={IMG.fieldNotes} alt="The Vault" className="block w-full rounded-2xl" loading="lazy" />
        </div>
      </div>
    ),
  },
  {
    label: 'Frequency Healing',
    title: <>Sacred Tones<br />Woven Through the Spiral.</>,
    desc: "Every Spiral module carries an assigned Solfeggio frequency — from 396 Hz (liberation from fear) to 963 Hz (awakening to source). These aren't background noise. They're keys that unlock the lesson at a cellular level.",
    bullets: [
      '396 Hz · 417 Hz · 528 Hz · 639 Hz · 741 Hz · 852 Hz · 963 Hz',
      'Each frequency paired to specific Hermetic principles',
      'Resonance Gate music library (coming soon)',
    ],
    visual: (
      <div className="relative">
        <div className="absolute -right-12 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-[#d4af37]/15 blur-[120px]" />
        <div className="relative overflow-hidden rounded-2xl border border-purple-500/15 shadow-[0_25px_60px_rgba(0,0,0,0.5),0_0_100px_rgba(107,70,193,0.12)]">
          <img src={IMG.resonanceGate} alt="Resonance Gate" className="block w-full rounded-2xl" loading="lazy" />
        </div>
      </div>
    ),
  },
];

const PRICING_ITEMS = [
  'Full Spiral Library — all 21+ modules across 3 tiers',
  '10 breathwork & somatic practices',
  'MoonSync lunar tracker with Kundalini alignment',
  'The Vault — private journaling & reflection space',
  'Solfeggio frequency tones in every Spiral module',
  'Resonance Gate music library (coming soon)',
  'New content added as the Spiral evolves',
];

/* ─── Sub-components ─── */

function FeatureSection({ feature }: { feature: Feature }) {
  return (
    <section className="relative overflow-hidden px-6 py-24">
      <div
        className={`relative z-[2] mx-auto grid max-w-[1100px] items-center gap-14 md:grid-cols-2 md:gap-16 ${
          feature.reversed ? 'md:[&>:last-child]:order-[-1]' : ''
        }`}
      >
        <div>
          <p className="mb-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#d4af37]">
            {feature.label}
          </p>
          <h3 className="mb-5 font-['Cinzel',serif] text-[clamp(1.8rem,3vw,2.6rem)] font-semibold leading-[1.15]">
            {feature.title}
          </h3>
          <p className="mb-7 text-[1.05rem] leading-[1.75] text-white/70">{feature.desc}</p>
          <div className="flex flex-col gap-3.5">
            {feature.bullets.map((b, i) => (
              <div key={i} className="flex items-start gap-3 text-[0.95rem] text-white/70">
                <span className="mt-0.5 shrink-0 text-[0.7rem] text-[#d4af37]">◆</span>
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>

        <div>{feature.visual}</div>
      </div>
    </section>
  );
}

function SignInModal({
  open,
  onClose,
  formId,
}: {
  open: boolean;
  onClose: () => void;
  formId: string;
}) {
  const navigate = useNavigate();
  const emailId = `${formId}-email`;
  const passwordId = `${formId}-password`;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
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
      onClose();
      navigate('/app');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${formId}-dialog-title`}
        className="relative z-10 w-full max-w-md rounded-3xl border border-purple-700/40 bg-purple-950/40 p-8 shadow-2xl backdrop-blur"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md px-2 py-1 text-sm font-medium text-purple-200/90 transition hover:bg-purple-900/50 hover:text-white"
        >
          Close
        </button>
        <h2
          id={`${formId}-dialog-title`}
          className="mb-2 pr-10 text-center text-2xl font-bold tracking-tight text-white"
        >
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
          <p className="pt-1 text-center text-sm text-purple-200/90">
            New here? Choose Enter to start checkout first.
          </p>
          <p className="text-center text-sm text-purple-200/85">
            <Link
              to="/auth/forgot"
              className="font-semibold text-[#d4af37] underline-offset-4 hover:underline"
            >
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
  );
}

/* ─── Main component ─── */

export default function EntryPage() {
  const navigate = useNavigate();
  const formId = useId();
  const [modalOpen, setModalOpen] = useState(false);

  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  /* Auto-redirect if already signed in */
  useEffect(() => {
    let active = true;
    const syncSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (active && session) navigate('/app', { replace: true });
    };
    void syncSession();
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active && session) navigate('/app', { replace: true });
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#14081f] text-white">
      {/* ─── Sticky top bar ─── */}
      <nav className="fixed inset-x-0 top-0 z-40 flex items-center gap-3 border-b border-purple-500/10 bg-[#14081f]/85 px-5 py-3 backdrop-blur-2xl">
        <img src={SIGIL_SRC} alt="" className="h-9 w-9 rounded-full ring-1 ring-white/15" />
        <span className="font-['Cinzel',serif] text-base font-medium tracking-wide">
          Spiral Ascension
        </span>
        <a
          href="#pricing"
          className="ml-auto rounded-lg border border-[#d4af37] px-5 py-2 text-xs font-semibold text-[#d4af37] transition hover:bg-[#d4af37]/10"
        >
          Start Free Trial
        </a>
      </nav>

      {/* ═══ SECTION 1 — HERO / STORY ═══ */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#24103d] via-[#2f1650] to-[#14081f] px-6 pb-20 pt-24 text-center">
        {/* radial overlays */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_85%_at_50%_0%,rgba(236,214,166,0.15)_0%,rgba(139,92,246,0.14)_32%,transparent_62%)] opacity-55" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 top-1/3 bg-[radial-gradient(ellipse_90%_55%_at_50%_65%,rgba(94,45,154,0.18)_0%,transparent_72%)]" />

        <img
          src={SIGIL_SRC}
          alt=""
          className="relative z-[2] mb-10 h-56 w-56 rounded-full shadow-2xl shadow-purple-500/40 motion-safe:animate-sigil-soft md:h-64 md:w-64"
        />

        <h1 className="relative z-[2] mb-12 font-['Cinzel',serif] text-4xl font-bold leading-[0.95] tracking-tight sm:text-5xl md:text-[4rem]">
          The Boy Who Knew
        </h1>

        <div className="relative z-[2] mx-auto w-full max-w-[680px] space-y-8 text-[1.05rem] leading-[1.72] text-[#f3edf9] sm:text-[1.2rem] md:space-y-10 md:text-[clamp(1.25rem,2.4vw,1.5rem)]">
          <p>{STORY_P1}</p>
          <p>{STORY_P2}</p>
          <p>{STORY_P3}</p>
        </div>

        {/* scroll hint */}
        <div className="relative z-[2] mt-14 flex animate-bounce flex-col items-center gap-2 text-white/40">
          <span className="text-xs uppercase tracking-[0.12em]">Discover what awaits</span>
          <svg className="h-5 w-5 stroke-[#d4af37]/60" viewBox="0 0 24 24" fill="none" strokeWidth={2}>
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
      </section>

      {/* ═══ SECTION 2 — MANIFESTO BRIDGE ═══ */}
      <section className="bg-gradient-to-b from-[#14081f] to-[#1c0e30] px-6 py-24 text-center">
        <div className="mx-auto max-w-[680px]">
          <h2 className="mb-7 font-['Cinzel',serif] text-[clamp(1.6rem,3.5vw,2.4rem)] font-medium tracking-wide text-[#d4af37]">
            Couldn't Find It, So I Built It.
          </h2>
          <p className="mb-4 text-lg leading-[1.8] text-white/70">
            The Spiral Ascension is a sovereign inner-work app built for seekers who don't fit the
            mold. Hermetic wisdom. Breathwork. Lunar alignment. Journaling. Frequency healing. All in
            one sacred digital space.
          </p>
          <p className="mt-10 font-['Cinzel',serif] text-sm italic tracking-[0.12em] text-white/40">
            I Am You. You Are Me. We Are One. Namaste.
          </p>
        </div>
      </section>

      {/* ═══ SECTION 3 — FEATURES ═══ */}
      <div className="bg-[#14081f]">
        {FEATURES.map((f, i) => (
          <FeatureSection key={i} feature={f} />
        ))}
      </div>

      {/* ═══ SECTION 4 — PRICING ═══ */}
      <section
        id="pricing"
        className="bg-gradient-to-b from-[#14081f] via-[#1e1035] to-[#14081f] px-6 py-28 text-center"
      >
        <h2 className="mb-4 font-['Cinzel',serif] text-[clamp(2rem,4vw,3rem)] font-semibold">
          One Price. Full Access.
        </h2>
        <p className="mx-auto mb-12 max-w-[480px] text-lg text-white/70">
          Everything inside the Spiral — every module, every practice, every tool — for less than a
          coffee.
        </p>

        <div className="mx-auto max-w-[420px] rounded-[20px] border border-[#d4af37]/20 bg-gradient-to-br from-[#2d1b4e]/60 to-[#1a0b2e]/80 px-10 py-12 shadow-[0_0_80px_rgba(107,70,193,0.1)]">
          <div className="font-['Cinzel',serif] text-[3.5rem] font-bold leading-none text-[#d4af37]">
            $3.33
            <span className="text-xl font-normal text-white/60">/month</span>
          </div>
          <p className="mb-8 mt-1.5 text-base text-white/60">Start with a 7-day free trial</p>

          <ul className="mb-9 space-y-0 text-left">
            {PRICING_ITEMS.map((item, i) => (
              <li
                key={i}
                className="flex items-center gap-2.5 border-b border-purple-500/8 py-2.5 text-[0.95rem] text-white/70"
              >
                <span className="text-[0.6rem] text-[#d4af37]">✦</span>
                {item}
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => navigate('/subscribe')}
            className="inline-flex min-w-[240px] items-center justify-center rounded-xl border border-[#d4af37]/60 bg-gradient-to-r from-[#8a2be2] via-[#9f3bf7] to-[#7c2bd3] px-10 py-[18px] text-lg font-bold tracking-wide text-white shadow-[0_0_30px_rgba(150,70,255,0.25)] transition hover:brightness-110 hover:shadow-[0_0_50px_rgba(150,70,255,0.4)]"
          >
            Begin the Spiral
          </button>
        </div>
      </section>

      {/* ═══ SECTION 5 — CLOSING CTA ═══ */}
      <section className="bg-gradient-to-b from-[#14081f] to-[#24103d] px-6 py-28 text-center">
        <img
          src={SIGIL_SRC}
          alt=""
          className="mx-auto mb-8 h-20 w-20 rounded-full opacity-70 shadow-[0_0_40px_rgba(139,92,246,0.3)]"
        />
        <h2 className="mb-4 font-['Cinzel',serif] text-[clamp(1.6rem,3vw,2.2rem)] font-medium">
          The Spiral Is Calling.
        </h2>
        <p className="mb-10 text-base text-white/50">
          Trust the descent. Remember what you already know.
        </p>
        <button
          type="button"
          onClick={() => navigate('/subscribe')}
          className="inline-flex min-w-[240px] items-center justify-center rounded-xl border border-[#d4af37]/60 bg-gradient-to-r from-[#8a2be2] via-[#9f3bf7] to-[#7c2bd3] px-10 py-[18px] text-lg font-bold tracking-wide text-white shadow-[0_0_30px_rgba(150,70,255,0.25)] transition hover:brightness-110"
        >
          Start Your Free Trial
        </button>
        <p className="mt-5 text-sm text-white/40">
          Already walking with us?{' '}
          <button
            type="button"
            onClick={openModal}
            className="font-medium text-white/80 underline-offset-4 transition hover:text-white hover:underline"
          >
            Sign in
          </button>
        </p>
      </section>

      {/* Sign-in modal */}
      <SignInModal open={modalOpen} onClose={closeModal} formId={formId} />
    </div>
  );
}
