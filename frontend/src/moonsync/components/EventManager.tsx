import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import EventDialog from './EventDialog';
import { useCurrentPhase } from '../hooks/useCurrentPhase';
import { amplifyPhases, fallbackAlignment, phaseAlignment } from '../data/phaseAlignment';
import { fallbackHarmonicAlignment, harmonicAlignment } from '../data/harmonicAlignment';

export default function EventManager() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [prefillTitle, setPrefillTitle] = useState<string | undefined>(undefined);
  // Same phase source as LunarDisplay above, so both blocks always agree.
  const current = useCurrentPhase();
  const { is13Month, phaseKey, phaseName, harmonic } = current;

  const alignment = useMemo(() => {
    if (is13Month) {
      const entry = harmonicAlignment[harmonic.month.month_number] ?? fallbackHarmonicAlignment;
      return { bestFor: entry.best_for, notIdealFor: entry.not_ideal_for };
    }
    return phaseAlignment[phaseKey] ?? fallbackAlignment;
  }, [is13Month, harmonic, phaseKey]);

  const energeticLabel = useMemo(() => {
    const amplify = is13Month
      ? (harmonicAlignment[harmonic.month.month_number] ?? fallbackHarmonicAlignment).energetic_mode === 'amplify'
      : amplifyPhases.has(phaseKey);
    return amplify ? 'Amplify momentum' : 'Dissolve resistance';
  }, [is13Month, harmonic, phaseKey]);

  const commitLabel = useMemo(() => {
    if (is13Month) {
      const entry = harmonicAlignment[harmonic.month.month_number];
      return entry?.action ?? `Commit to a shift matching the ${harmonic.month.name} · ${harmonic.month.archetype} arc`;
    }
    return `Commit to a shift matching the ${phaseName} arc`;
  }, [is13Month, harmonic, phaseName]);

  const arcLabel = is13Month ? `${harmonic.month.name} · ${harmonic.month.archetype}` : phaseName;
  const alignmentTitle = is13Month ? 'Harmonic Alignment' : 'Phase Alignment';

  const openWithTitle = (title?: string) => {
    setPrefillTitle(title);
    setIsDialogOpen(true);
  };

  return (
    <>
      <Card className="border-purple-400/15 bg-[#3a2563]/24 shadow-lg">
        <CardHeader>
          <div className="space-y-1">
            <CardTitle className="text-white">Choose Your Action</CardTitle>
            <CardDescription className="text-purple-200">
              {is13Month
                ? `Simple actions aligned with the ${arcLabel} month, ready to anchor into your MoonSync log.`
                : 'Simple, phase-aligned actions you can anchor into your MoonSync log.'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-purple-300">Light Actions</p>
            <div className="space-y-2">
              <button
                type="button"
                className="w-full text-left px-4 py-2 rounded-lg bg-[#4a3277]/20 hover:bg-[#4a3277]/32 text-sm text-purple-50 transition-colors"
                onClick={() => openWithTitle('Set a simple intention')}
              >
                Set a simple intention
              </button>
              <button
                type="button"
                className="w-full text-left px-4 py-2 rounded-lg bg-[#4a3277]/20 hover:bg-[#4a3277]/32 text-sm text-purple-50 transition-colors"
                onClick={() => openWithTitle('Release one small thing')}
              >
                Release one small thing
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-purple-300">Focused Actions</p>
            <div className="space-y-2">
              <button
                type="button"
                className="w-full text-left px-4 py-2 rounded-lg bg-[#4a3277]/20 hover:bg-[#4a3277]/32 text-sm text-purple-50 transition-colors"
                onClick={() => openWithTitle('Align one action with this phase')}
              >
                Align one action with this phase
              </button>
              <button
                type="button"
                className="w-full text-left px-4 py-2 rounded-lg bg-[#4a3277]/20 hover:bg-[#4a3277]/32 text-sm text-purple-50 transition-colors"
                onClick={() => openWithTitle('Prepare for the next transition')}
              >
                Prepare for the next transition
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-purple-300">Energetic Actions</p>
            <div className="space-y-2">
              <button
                type="button"
                className="w-full text-left px-4 py-2 rounded-lg bg-[#4a3277]/20 hover:bg-[#4a3277]/32 text-sm text-purple-50 transition-colors"
                onClick={() => openWithTitle(energeticLabel)}
              >
                {energeticLabel}
              </button>
              <button
                type="button"
                className="w-full text-left px-4 py-2 rounded-lg bg-[#4a3277]/20 hover:bg-[#4a3277]/32 text-sm text-purple-50 transition-colors"
                onClick={() => openWithTitle(commitLabel)}
              >
                {commitLabel}
              </button>
            </div>
          </div>

          <div className="space-y-2 border-t border-purple-400/15 pt-4">
            <p className="text-xs uppercase tracking-wide text-purple-300">{alignmentTitle}</p>
            <p className="text-xs text-purple-300/80">{arcLabel}</p>
            <p className="text-sm text-purple-200">
              <span className="font-medium text-purple-100">Best for:</span> {alignment.bestFor}
            </p>
            <p className="text-sm text-purple-200">
              <span className="font-medium text-purple-100">Not ideal for:</span> {alignment.notIdealFor}
            </p>
          </div>

          <div className="pt-2">
            <Button
              type="button"
              onClick={() => openWithTitle(undefined)}
              className="w-full rounded-full bg-amber-500 hover:bg-amber-400 text-purple-950 font-medium"
            >
              + Create Your Own
            </Button>
          </div>
        </CardContent>
      </Card>

      <EventDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setPrefillTitle(undefined);
          }
        }}
        initialTitle={prefillTitle}
      />
    </>
  );
}
