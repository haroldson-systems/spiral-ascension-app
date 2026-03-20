import { Link } from 'react-router-dom';
import { Moon, ArrowLeft } from 'lucide-react';
import CycleToggle from '@/moonsync/components/CycleToggle';
import LunarDisplay from '@/moonsync/components/LunarDisplay';
import EventManager from '@/moonsync/components/EventManager';
import { useCyclePreference } from '@/moonsync/hooks/useQueries';
import { isThirteenMonth } from '@/moonsync/backend';

const harmonicCopy = {
  title: 'MoonSync — 13-Month Harmonic Cycle',
  description:
    'Explore your year through a conceptual 13-month calendar inspired by natural seasonal patterns. Each month highlights a symbolic theme you can use for reflection, planning, or personal rhythm.',
  howThisWorks: [
    'The year is divided into 13 equal-length months, beginning with April.',
    'Each month includes meaning, historical context, and simple suggestions.',
    'Themes are symbolic and optional — use only what resonates.',
    '"Next Month" shows what part of the harmonic cycle comes after the current one.'
  ],
  disclaimer: 'A conceptual framework for observing your yearly rhythm.'
};

export default function MoonSyncTrackerPage() {
  const { data: preference } = useCyclePreference();
  const is13Month = preference && isThirteenMonth(preference.cycleType);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0b2e] via-[#3a2563] to-[#1a0b2e]">
      <header className="border-b border-purple-400/15 bg-[#3a2563]/24">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-7xl">
          <Link
            to="/"
            className="flex items-center gap-2 text-purple-200 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Spiral Ascension
          </Link>
          <div className="flex items-center gap-2">
            <Moon className="h-8 w-8 text-amber-400" />
            <h1 className="text-xl font-bold text-white">MoonSync Tracker</h1>
          </div>
          <div className="w-[180px]" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-8 rounded-2xl bg-[#3a2563]/22 backdrop-blur-sm border border-purple-400/15 shadow-xl p-6 lg:p-8">
          <div className="text-center space-y-3 py-6">
            <div className="flex items-center justify-center space-x-3">
              <Moon className="h-10 w-10 text-amber-400" />
              <h2 className="text-4xl font-bold text-white">MoonSync</h2>
            </div>
            <p className="text-lg text-purple-200 max-w-xl mx-auto">
              Track lunar cycles, align your rituals, and sync with the moon&apos;s energy
            </p>
            {is13Month ? (
              <div className="mx-auto max-w-2xl rounded-xl border border-purple-400/15 bg-[#3a2563]/22 px-4 py-4 text-left">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-300">
                  {harmonicCopy.title}
                </h3>
                <p className="mt-2 text-sm text-purple-200">{harmonicCopy.description}</p>
                <ul className="mt-3 space-y-2 text-sm text-purple-200">
                  {harmonicCopy.howThisWorks.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-purple-300">{harmonicCopy.disclaimer}</p>
              </div>
            ) : null}
          </div>

          {!is13Month ? (
            <p className="text-center text-sm text-purple-200">
              Choose between the standard 12-month lunar cycle and the optional 13-month harmonic mode.
            </p>
          ) : null}
          <CycleToggle />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LunarDisplay />
            <EventManager />
          </div>
        </div>
      </main>
    </div>
  );
}
