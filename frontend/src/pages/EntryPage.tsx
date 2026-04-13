import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

const SIGIL_SRC =
  'https://d64gsuwffb70l.cloudfront.net/68ea93297761a5e6965f5a33_1760211661373_fc5c3f5d.jpg';

function Section({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mx-auto max-w-2xl px-6 py-20 md:py-28">
      <p className="mb-3 text-xs uppercase tracking-[0.3em] text-[#e8d5a3]/80">{label}</p>
      <h2 className="mb-6 text-2xl font-bold tracking-tight text-[#f5f3ff] md:text-3xl">{title}</h2>
      <div className="space-y-4 text-base leading-relaxed text-white/80 md:text-lg">{children}</div>
    </section>
  );
}

export default function EntryPage() {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#1a0b2e] via-[#2d1b4e] to-[#12081f] text-white">
      <div className="pointer-events-none absolute inset-0 opacity-25">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,_#6b46c1_0%,_transparent_55%)]" />
      </div>

      <main className="relative z-10">
        <div className="mx-auto flex max-w-2xl flex-col items-center px-6 pb-8 pt-16 text-center md:pt-24">
          <div className="mb-10 opacity-90">
            <img
              src={SIGIL_SRC}
              alt=""
              className="mx-auto h-36 w-36 rounded-full shadow-2xl shadow-purple-600/30 ring-1 ring-[#d4af37]/20 md:h-44 md:w-44"
            />
          </div>
          <p className="text-xs uppercase tracking-[0.35em] text-[#e8d5a3]/90">The Spiral Ascension</p>
        </div>

        <Section label="The pull" title="You didn't arrive here by accident.">
          <p>
            Something in you already knew there was more than noise. This is a quiet threshold—not a pitch, not a
            promise of fixing you.
          </p>
        </Section>

        <Section label="The recognition" title="What if nothing is wrong with you?">
          <p>
            What if you were never broken—only untrained in remembering? The work here is gentle alignment: breath,
            attention, and return to center.
          </p>
        </Section>

        <Section label="The threshold" title="A path in sevens.">
          <p>
            Seven modules echo seven Hermetic laws, carried in seven frequencies. Breathwork, simple rituals, and a
            steady return to center weave the rhythm—not as performance, but as practice you can live.
          </p>
        </Section>

        <Section label="The commitment" title="First week free. $3.33/month after.">
          <p>
            The exchange is part of the practice: small, honest, recurring. It keeps the space tended without turning
            the sacred into spectacle.
          </p>
        </Section>

        <section className="mx-auto max-w-2xl px-6 pb-28 pt-8 text-center md:pb-36">
          <p className="mb-6 text-xs uppercase tracking-[0.3em] text-[#e8d5a3]/80">The door</p>
          <Link
            to="/subscribe"
            className="inline-flex min-w-[12rem] items-center justify-center rounded-lg border-2 border-[#d4af37]/80 bg-gradient-to-r from-purple-700 to-purple-900 px-10 py-4 text-lg font-semibold tracking-wide text-white shadow-lg shadow-purple-900/40 transition hover:from-purple-600 hover:to-purple-800"
          >
            Enter
          </Link>
          <p className="mt-8 text-sm text-white/65">
            Already walking with us?{' '}
            <Link to="/auth" className="font-medium text-[#e8d5a3] underline-offset-4 transition hover:text-[#f5ebd4] hover:underline">
              Sign in
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}
