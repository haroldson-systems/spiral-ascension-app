import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getMoonSignDashboard, getPrepWindowStart } from '../moonSignEngine';
import { moonSignProfiles } from '../data/moonSignProfiles';

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function formatDuration(until: Date) {
  const diffMs = until.getTime() - Date.now();
  if (diffMs <= 0) return 'changing soon';

  const totalHours = Math.max(1, Math.round(diffMs / (60 * 60 * 1000)));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  if (days === 0) return `${hours} hr remaining`;
  if (hours === 0) return `${days} day${days === 1 ? '' : 's'} remaining`;
  return `${days} day${days === 1 ? '' : 's'} ${hours} hr remaining`;
}

export default function MoonSignKundalini() {
  const dashboard = useMemo(() => getMoonSignDashboard(), []);
  const currentProfile = moonSignProfiles[dashboard.current.sign];
  const nextProfile = moonSignProfiles[dashboard.next.sign];
  const currentPrepStart = getPrepWindowStart(dashboard.current.startsAt);
  const nextPrepStart = getPrepWindowStart(dashboard.next.startsAt);
  const upcoming = dashboard.monthlyIngresses.filter((window) => window.startsAt > new Date()).slice(0, 8);

  return (
    <Card className="border-purple-400/15 bg-[#3a2563]/24 shadow-lg">
      <CardHeader>
        <CardTitle className="text-white">Moon Sign Kundalini Tracker</CardTitle>
        <CardDescription className="text-purple-200">
          Live lunar zodiac context for body awareness, practice timing, and optional prep windows.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-2xl border border-amber-400/20 bg-[#120a24]/45 p-5">
          <p className="text-xs uppercase tracking-wide text-purple-300">Moon Today</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-4xl font-bold text-white">Moon in {dashboard.current.sign}</h3>
              <p className="mt-1 text-sm text-amber-300">
                {currentProfile.element} element · {formatDuration(dashboard.current.endsAt)}
              </p>
            </div>
            <div className="text-sm text-purple-200 sm:text-right">
              <p>{formatDateTime(dashboard.current.startsAt)}</p>
              <p>to {formatDateTime(dashboard.current.endsAt)}</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-purple-100">{currentProfile.transitTheme}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-purple-400/15 bg-[#4a3277]/16 p-4">
            <p className="text-xs uppercase tracking-wide text-purple-300">Kundalini Cue</p>
            <p className="mt-2 text-sm leading-relaxed text-purple-100">{currentProfile.kundaliniCue}</p>
          </div>
          <div className="rounded-xl border border-purple-400/15 bg-[#4a3277]/16 p-4">
            <p className="text-xs uppercase tracking-wide text-purple-300">Body Focus</p>
            <p className="mt-2 text-sm leading-relaxed text-purple-100">{currentProfile.bodyFocus}</p>
          </div>
        </div>

        <div className="rounded-xl border border-purple-400/15 bg-[#120a24]/35 p-4">
          <p className="text-xs uppercase tracking-wide text-purple-300">Practice Suggestion</p>
          <p className="mt-2 text-sm leading-relaxed text-purple-100">{currentProfile.practiceSuggestion}</p>
          <p className="mt-4 text-xs uppercase tracking-wide text-purple-300">Optional Shadow Prompt</p>
          <p className="mt-2 text-sm leading-relaxed text-purple-100">{currentProfile.shadowWorkPrompt}</p>
        </div>

        <div className="rounded-xl border border-amber-400/15 bg-amber-500/10 p-4">
          <p className="text-xs uppercase tracking-wide text-amber-300">Optional Fasting / Prep Window</p>
          <p className="mt-2 text-sm leading-relaxed text-purple-100">
            If fasting is part of your practice, the traditional prep window can be observed as the two days before a sign ingress.
          </p>
          <div className="mt-3 grid gap-3 text-sm text-purple-200 sm:grid-cols-2">
            <div>
              <p className="font-medium text-white">Current prep window</p>
              <p>{formatDateTime(currentPrepStart)} to {formatDateTime(dashboard.current.startsAt)}</p>
            </div>
            <div>
              <p className="font-medium text-white">Next prep window</p>
              <p>{formatDateTime(nextPrepStart)} to {formatDateTime(dashboard.next.startsAt)}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-purple-400/15 pt-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-purple-300">Coming Next</p>
              <p className="mt-1 text-sm text-purple-100">
                {dashboard.next.sign} · {nextProfile.element} · starts {formatDateTime(dashboard.next.startsAt)}
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {upcoming.map((window) => (
              <div
                key={`${window.sign}-${window.startsAt.toISOString()}`}
                className="flex items-center justify-between gap-3 rounded-lg bg-[#4a3277]/18 px-3 py-2 text-sm"
              >
                <span className="font-medium text-white">{window.sign}</span>
                <span className="text-right text-purple-200">{formatDateTime(window.startsAt)}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
