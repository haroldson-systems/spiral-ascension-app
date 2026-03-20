import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import EventDialog from './EventDialog';
import { useMoonPhase } from '../hooks/useMoonPhase';

export default function EventManager() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [prefillTitle, setPrefillTitle] = useState<string | undefined>(undefined);
  const phaseData = useMoonPhase();

  const phaseAlignment = useMemo(() => {
    const alignmentMap: Record<string, { bestFor: string; notIdealFor: string }> = {
      'New Moon': {
        bestFor: 'setting intentions, new beginnings, planting seeds',
        notIdealFor: 'closing loops, heavy release work'
      },
      'Waxing Crescent': {
        bestFor: 'building momentum, early action, gathering resources',
        notIdealFor: 'completion work, deep reflection'
      },
      'First Quarter': {
        bestFor: 'decision-making, pushing through resistance, taking action',
        notIdealFor: 'rest, waiting'
      },
      'Waxing Gibbous': {
        bestFor: 'refining, adjusting, commitment',
        notIdealFor: 'starting from scratch'
      },
      'Full Moon': {
        bestFor: 'culmination, celebration, visibility, completion',
        notIdealFor: 'quiet reflection, low-energy work'
      },
      'Waning Gibbous': {
        bestFor: 'release, completion, gratitude, closing loops',
        notIdealFor: 'new launches, initiation, pushing hard'
      },
      'Last Quarter': {
        bestFor: 'letting go, evaluation, clearing space',
        notIdealFor: 'new commitments, starting projects'
      },
      'Waning Crescent': {
        bestFor: 'rest, integration, deep reflection',
        notIdealFor: 'new commitments, external action'
      }
    };

    return (
      alignmentMap[phaseData?.phase ?? ''] ?? {
        bestFor: 'reflection and phase-aware planning',
        notIdealFor: 'forcing action without clarity'
      }
    );
  }, [phaseData]);

  const energeticLabel = useMemo(() => {
    const phase = phaseData?.phase ?? 'current phase';
    const isMomentum =
      /New|Waxing|Full/.test(phase);
    return isMomentum ? 'Amplify momentum' : 'Dissolve resistance';
  }, [phaseData]);

  const commitLabel = useMemo(() => {
    const phase = phaseData?.phase ?? 'current phase';
    return `Commit to a shift matching the ${phase} arc`;
  }, [phaseData]);

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
              Simple, phase-aligned actions you can anchor into your MoonSync log.
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
            <p className="text-xs uppercase tracking-wide text-purple-300">Phase Alignment</p>
            <p className="text-sm text-purple-200">
              <span className="font-medium text-purple-100">Best for:</span> {phaseAlignment.bestFor}
            </p>
            <p className="text-sm text-purple-200">
              <span className="font-medium text-purple-100">Not ideal for:</span> {phaseAlignment.notIdealFor}
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
