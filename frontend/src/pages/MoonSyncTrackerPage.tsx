import { Link } from 'react-router-dom';
import { Moon, ArrowLeft } from 'lucide-react';
import CycleToggle from '@/moonsync/components/CycleToggle';
import LunarDisplay from '@/moonsync/components/LunarDisplay';
import EventManager from '@/moonsync/components/EventManager';

export default function MoonSyncTrackerPage() {
  return (
    <div className="min-h-screen bg-purple-950">
      <header className="border-b border-purple-700/50 bg-purple-900/40">
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
        <div className="space-y-8 rounded-2xl bg-purple-900/60 backdrop-blur-sm border border-purple-700/50 shadow-xl p-6 lg:p-8">
          <div className="text-center space-y-3 py-6">
            <div className="flex items-center justify-center space-x-3">
              <Moon className="h-10 w-10 text-amber-400" />
              <h2 className="text-4xl font-bold text-white">MoonSync</h2>
            </div>
            <p className="text-lg text-purple-200 max-w-xl mx-auto">
              Track lunar cycles, align your rituals, and sync with the moon&apos;s energy
            </p>
          </div>

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
