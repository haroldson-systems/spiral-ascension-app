import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLunarPhases, useCyclePreference } from '../hooks/useQueries';
import { LunarPhase, CycleType, isThirteenMonth } from '../backend';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

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

const phaseDescriptions: Record<string, string> = {
  newMoon: 'A time for new beginnings and setting intentions',
  waxingCrescent: 'Energy is building, focus on growth',
  firstQuarter: 'Take action and overcome challenges',
  waxingGibbous: 'Refine and adjust your plans',
  fullMoon: 'Peak energy, time for manifestation and celebration',
  waningGibbous: 'Share your wisdom and give thanks',
  lastQuarter: 'Release what no longer serves you',
  waningCrescent: 'Rest, reflect, and prepare for renewal',
};

function phaseKey(p: typeof LunarPhase.newMoon): string {
  if ('newMoon' in p) return 'newMoon';
  if ('waxingCrescent' in p) return 'waxingCrescent';
  if ('firstQuarter' in p) return 'firstQuarter';
  if ('waxingGibbous' in p) return 'waxingGibbous';
  if ('fullMoon' in p) return 'fullMoon';
  if ('waningGibbous' in p) return 'waningGibbous';
  if ('lastQuarter' in p) return 'lastQuarter';
  if ('waningCrescent' in p) return 'waningCrescent';
  return 'newMoon';
}

export default function LunarDisplay() {
  const { data: preference } = useCyclePreference();
  const { data: phases, isLoading, isFetching } = useLunarPhases(preference?.cycleType);
  const [currentPhase, setCurrentPhase] = useState<string>('newMoon');
  const [nextPhase, setNextPhase] = useState<{ phase: string; date: Date } | null>(null);

  useEffect(() => {
    if (!phases || phases.length === 0) return;

    const now = BigInt(Date.now()) * BigInt(1_000_000);

    let foundCurrent = 'newMoon';
    let foundNext: { phase: string; date: Date } | null = null;

    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];
      if (phase.startDate <= now && now <= phase.endDate) {
        foundCurrent = phaseKey(phase.phase);
        if (i + 1 < phases.length) {
          const next = phases[i + 1];
          foundNext = {
            phase: phaseKey(next.phase),
            date: new Date(Number(next.startDate / BigInt(1_000_000))),
          };
        }
        break;
      }
    }

    setCurrentPhase(foundCurrent);
    setNextPhase(foundNext);
  }, [phases]);

  if (isLoading) {
    return (
      <Card className="border-purple-700/50 bg-purple-900/60">
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-700/50 bg-purple-900/60 shadow-lg relative">
      {isFetching && (
        <div className="absolute top-4 right-4">
          <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-white">Current Lunar Phase</CardTitle>
        <CardDescription className="text-purple-200">
          {preference && isThirteenMonth(preference.cycleType) ? '13-Month' : '12-Month'} Cycle
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center space-y-4 py-6">
          <div className="text-9xl animate-pulse">
            {phaseEmojis[currentPhase] ?? '🌑'}
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold text-white">
              {phaseNames[currentPhase] ?? 'Loading...'}
            </h3>
            <p className="text-amber-400/90 text-sm font-medium">Energy</p>
            <p className="text-purple-200 max-w-sm text-sm">
              {phaseDescriptions[currentPhase] ?? ''}
            </p>
          </div>
        </div>

        {nextPhase && (
          <div className="border-t border-purple-700/50 pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-purple-300">Next Phase:</span>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{phaseEmojis[nextPhase.phase]}</span>
                <div className="text-right">
                  <div className="font-medium text-white">{phaseNames[nextPhase.phase]}</div>
                  <div className="text-xs text-purple-300">
                    {nextPhase.date.toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-4 gap-2 pt-4 border-t border-purple-700/50">
          {Object.entries(phaseEmojis).map(([key, emoji]) => (
            <div
              key={key}
              className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                currentPhase === key
                  ? 'bg-amber-500/20 border border-amber-400/40 scale-105'
                  : 'bg-purple-800/40 opacity-70 hover:opacity-100 border border-transparent'
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
