import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { useLunarPhases, useCyclePreference } from '../hooks/useQueries';
import { LunarPhase, isThirteenMonth } from '../backend';
import { Loader2, ChevronDown } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { phaseMeaning } from '../data/phaseMeaning';
import { getPhaseTimeline } from '../lunarEngine';
import { getHarmonicTimeline, getHarmonicWindow, getNextHarmonicWindow } from '../harmonicCalendar';
import { useMoonPhase } from '../hooks/useMoonPhase';

const phaseEmojis: Record<string, string> = {
  newMoon: '🌑',
  waxingCrescent: '🌒',
  firstQuarter: '🌓',
  waxingGibbous: '🌔',
  fullMoon: '🌕',
  waningGibbous: '🌖',
  lastQuarter: '🌗',
  waningCrescent: '🌘',
};

const phaseNames: Record<string, string> = {
  newMoon: 'New Moon',
  waxingCrescent: 'Waxing Crescent',
  firstQuarter: 'First Quarter',
  waxingGibbous: 'Waxing Gibbous',
  fullMoon: 'Full Moon',
  waningGibbous: 'Waning Gibbous',
  lastQuarter: 'Last Quarter',
  waningCrescent: 'Waning Crescent',
};

const phaseLoreLinks: Record<string, string> = {
  newMoon: '/practice-entry/lore-new-moon',
  waxingCrescent: '/practice-entry/lore-waxing-crescent',
  firstQuarter: '/practice-entry/lore-first-quarter',
  waxingGibbous: '/practice-entry/lore-waxing-gibbous',
  fullMoon: '/practice-entry/lore-full-moon',
  waningGibbous: '/practice-entry/lore-waning-gibbous',
  lastQuarter: '/practice-entry/lore-last-quarter',
  waningCrescent: '/practice-entry/lore-balsamic',
};

function formatDate(value: number) {
  return new Date(value).toLocaleDateString();
}

export default function LunarDisplay() {
  const { data: preference } = useCyclePreference();
  const { data: phases, isLoading, isFetching } = useLunarPhases(preference?.cycleType);
  const [currentPhase, setCurrentPhase] = useState<string>('newMoon');
  const [nextPhase, setNextPhase] = useState<{ phase: string; date: Date } | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const is13Month = preference && isThirteenMonth(preference.cycleType);
  const moonNow = useMoonPhase();

  const timeline = useMemo(() => {
    if (!phases || phases.length === 0) return null;
    return getPhaseTimeline(phases, Date.now());
  }, [phases]);

  useEffect(() => {
    if (is13Month) {
      // Harmonic mode uses backend timeline for consistency.
      if (!timeline) return;
      setCurrentPhase(timeline.current?.phaseKey ?? 'newMoon');
      if (timeline.next) {
        setNextPhase({
          phase: timeline.next.phaseKey,
          date: new Date(timeline.next.startMs)
        });
      } else {
        setNextPhase(null);
      }
      return;
    }

    // 12‑month mode: derive current phase from SunCalc hook.
    if (!moonNow) return;
    const label = moonNow.phase;
    const key =
      Object.entries(phaseNames).find(([, name]) => name === label)?.[0] ?? 'newMoon';
    setCurrentPhase(key);

    if (moonNow.nextPhase) {
      const nextLabel = moonNow.nextPhase.name;
      const nextKey =
        Object.entries(phaseNames).find(([, name]) => name === nextLabel)?.[0] ??
        'newMoon';
      setNextPhase({ phase: nextKey, date: moonNow.nextPhase.date });
    } else {
      setNextPhase(null);
    }
  }, [timeline, moonNow, is13Month]);

  const meaning = phaseMeaning[currentPhase] ?? phaseMeaning.newMoon;
  const currentLoreHref = phaseLoreLinks[currentPhase] ?? '/practice-entry/lore-new-moon';
  const harmonicCurrent = useMemo(() => getHarmonicWindow(), []);
  const harmonicNext = useMemo(() => getNextHarmonicWindow(), []);
  const harmonicTimeline = useMemo(() => getHarmonicTimeline(), []);

  if (isLoading) {
    return (
      <Card className="border-purple-400/15 bg-[#3a2563]/24">
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
        </CardContent>
      </Card>
    );
  }

    return (
      <Card className="border-purple-400/15 bg-[#3a2563]/24 shadow-lg relative">
      {isFetching && (
        <div className="absolute top-4 right-4">
          <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-white">{is13Month ? 'Current Harmonic Month' : 'Current Lunar Phase'}</CardTitle>
        <CardDescription className="text-purple-200">
          {preference && isThirteenMonth(preference.cycleType) ? '13-Month' : '12-Month'} Cycle
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {is13Month ? (
          <div className="flex flex-col items-center space-y-4 py-6">
            <div className="text-5xl font-bold text-white">{harmonicCurrent.month.name}</div>
            <div className="text-sm uppercase tracking-wide text-amber-300">
              {harmonicCurrent.month.archetype}
            </div>
            <p className="text-purple-200 max-w-sm text-sm text-center">
              {harmonicCurrent.month.meaning_basic}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4 py-6">
            <div className="text-9xl animate-pulse">
              {phaseEmojis[currentPhase] ?? '🌑'}
            </div>
            <div className="text-center">
              <h3 className="text-5xl font-bold text-white mt-4 mb-4">
                {phaseNames[currentPhase] ?? 'Loading...'}
              </h3>
              <p className="text-2xl text-amber-400/90 font-medium mb-3">Energy</p>
              <p className="text-purple-200 max-w-sm text-sm">{meaning.meaning_basic}</p>
            </div>
          </div>
        )}

        {is13Month ? (
          <div className="border-t border-purple-400/15 pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-purple-300">Next Month:</span>
              <div className="text-right">
                <div className="font-medium text-white">{harmonicNext.month.name}</div>
                <div className="text-xs text-purple-300">{formatDate(harmonicNext.startMs)}</div>
              </div>
            </div>
          </div>
        ) : (
          nextPhase && (
          <div className="border-t border-purple-400/15 pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-purple-300">Next Phase:</span>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{phaseEmojis[nextPhase.phase]}</span>
                <div className="text-right">
                  <div className="font-medium text-white">{phaseNames[nextPhase.phase]}</div>
                  <div className="text-xs text-purple-300">
                    {formatDate(nextPhase.date.getTime())}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="border-t border-purple-400/15 pt-4 space-y-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-purple-300">Historical Context</p>
            <ul className="mt-2 space-y-1 text-sm text-purple-200">
              {(is13Month ? harmonicCurrent.month.historical_context : meaning.historical).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-purple-300">Beginner Suggestions</p>
            <ul className="mt-2 space-y-1 text-sm text-purple-200">
              {(is13Month ? harmonicCurrent.month.suggestions_basic : meaning.suggestions_basic).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          {!is13Month ? (
            <div>
              <p className="text-xs uppercase tracking-wide text-purple-300">Learn more</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  to={currentLoreHref}
                  className="rounded-full border border-purple-500/30 bg-purple-800/40 px-3 py-1 text-sm text-purple-100 transition-colors hover:border-purple-400/50 hover:text-white"
                >
                  Lunar Lore
                </Link>
                <Link
                  to="/practice-entry/lunar-lore-gate-2"
                  className="rounded-full border border-purple-500/30 bg-purple-800/40 px-3 py-1 text-sm text-purple-100 transition-colors hover:border-purple-400/50 hover:text-white"
                >
                  Ritual Archive
                </Link>
                <Link
                  to="/practice-entry/magick-framework-solar-vs-lunar-time"
                  className="rounded-full border border-purple-500/30 bg-purple-800/40 px-3 py-1 text-sm text-purple-100 transition-colors hover:border-purple-400/50 hover:text-white"
                >
                  Magick Framework
                </Link>
              </div>
            </div>
          ) : null}
          <div>
            <p className="text-xs uppercase tracking-wide text-purple-300">MoonSync Perspective</p>
            <p className="mt-2 text-sm text-purple-200">
              {is13Month ? harmonicCurrent.month.moonsync_perspective : meaning.moonsync_perspective}
            </p>
          </div>
          <button
            type="button"
            className="flex items-center gap-2 text-sm text-amber-300 hover:text-amber-200"
            onClick={() => setShowAdvanced((prev) => !prev)}
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            {showAdvanced ? 'Hide advanced context' : 'Show advanced context'}
          </button>
          {showAdvanced && (
            <ul className="space-y-1 text-sm text-purple-200">
              {(is13Month ? harmonicCurrent.month.advanced_optional : meaning.advanced_optional).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </div>

        {is13Month ? (
          <div className="border-t border-purple-400/15 pt-4 space-y-2">
            <p className="text-xs uppercase tracking-wide text-purple-300">Harmonic Timeline</p>
            <div className="flex h-2 overflow-hidden rounded-full bg-[#4a3277]/22">
              {harmonicTimeline.map((window) => (
                <div
                  key={`${window.month.month_number}-${window.startMs}`}
                  className={`flex-1 ${
                    window.month.month_number === harmonicCurrent.month.month_number
                      ? 'bg-amber-400'
                      : 'bg-purple-600/50'
                  }`}
                  title={`${window.month.name} • ${formatDate(window.startMs)}`}
                />
              ))}
            </div>
            <div className="flex items-center justify-between text-xs text-purple-300">
              <span>{harmonicTimeline[0]?.month.name}</span>
              <span>{harmonicTimeline[harmonicTimeline.length - 1]?.month.name}</span>
            </div>
          </div>
        ) : timeline?.windows?.length ? (
          <div className="border-t border-purple-400/15 pt-4 space-y-2">
            <p className="text-xs uppercase tracking-wide text-purple-300">Phase Timeline</p>
            <div className="flex h-2 overflow-hidden rounded-full bg-[#4a3277]/22">
              {timeline.windows.slice(0, 8).map((window) => (
                <div
                  key={`${window.phaseKey}-${window.startMs}`}
                  className={`flex-1 ${
                    window.phaseKey === currentPhase ? 'bg-amber-400' : 'bg-purple-600/50'
                  }`}
                  title={`${phaseNames[window.phaseKey]} • ${formatDate(window.startMs)}`}
                />
              ))}
            </div>
            <div className="flex items-center justify-between text-xs text-purple-300">
              <span>{phaseNames[timeline.windows[0].phaseKey]}</span>
              <span>{phaseNames[timeline.windows[Math.min(7, timeline.windows.length - 1)].phaseKey]}</span>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-4 gap-2 pt-4 border-t border-purple-400/15">
          {Object.entries(phaseEmojis).map(([key, emoji]) => (
            <div
              key={key}
              className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                currentPhase === key
                  ? 'bg-amber-500/20 border border-amber-400/40 scale-105'
                  : 'bg-[#4a3277]/20 opacity-85 hover:opacity-100 border border-transparent'
              }`}
            >
              <span className="text-2xl">{emoji}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
