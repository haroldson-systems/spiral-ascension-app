import { useMemo } from 'react';
import { useCyclePreference, useLunarPhases } from './useQueries';
import { isThirteenMonth } from '../backend';
import { getPhaseTimeline } from '../lunarEngine';
import { useMoonPhase } from './useMoonPhase';
import { getHarmonicWindow, HarmonicWindow } from '../harmonicCalendar';

export const phaseNames: Record<string, string> = {
  newMoon: 'New Moon',
  waxingCrescent: 'Waxing Crescent',
  firstQuarter: 'First Quarter',
  waxingGibbous: 'Waxing Gibbous',
  fullMoon: 'Full Moon',
  waningGibbous: 'Waning Gibbous',
  lastQuarter: 'Last Quarter',
  waningCrescent: 'Waning Crescent',
};

export function phaseKeyFromName(name: string | undefined): string {
  return Object.entries(phaseNames).find(([, label]) => label === name)?.[0] ?? 'newMoon';
}

export type CurrentPhase = {
  /** True once the cycle preference has loaded. */
  ready: boolean;
  is13Month: boolean;
  /** Current phase key (newMoon … waningCrescent). */
  phaseKey: string;
  phaseName: string;
  nextPhase: { phaseKey: string; date: Date } | null;
  /** Current harmonic month window (always computed; meaningful in 13-month mode). */
  harmonic: HarmonicWindow;
  /** Backend phase timeline (13-month mode) for timeline rendering. */
  timeline: ReturnType<typeof getPhaseTimeline> | null;
  isLoading: boolean;
  isFetching: boolean;
};

/**
 * Single source of truth for "what phase is it right now", shared by LunarDisplay and
 * EventManager so both blocks always agree.
 *
 * 12-month mode → astronomical phase from SunCalc (useMoonPhase).
 * 13-month mode → backend 28-day harmonic timeline (useLunarPhases), same as the display card.
 */
export function useCurrentPhase(): CurrentPhase {
  const { data: preference } = useCyclePreference();
  const { data: phases, isLoading, isFetching } = useLunarPhases(preference?.cycleType);
  const moonNow = useMoonPhase();
  const is13Month = Boolean(preference && isThirteenMonth(preference.cycleType));

  const timeline = useMemo(() => {
    if (!phases || phases.length === 0) return null;
    return getPhaseTimeline(phases, Date.now());
  }, [phases]);

  const harmonic = useMemo(() => getHarmonicWindow(), []);

  return useMemo(() => {
    let phaseKey = 'newMoon';
    let nextPhase: CurrentPhase['nextPhase'] = null;

    if (is13Month) {
      phaseKey = timeline?.current?.phaseKey ?? 'newMoon';
      nextPhase = timeline?.next ? { phaseKey: timeline.next.phaseKey, date: new Date(timeline.next.startMs) } : null;
    } else if (moonNow) {
      phaseKey = phaseKeyFromName(moonNow.phase);
      nextPhase = moonNow.nextPhase
        ? { phaseKey: phaseKeyFromName(moonNow.nextPhase.name), date: moonNow.nextPhase.date }
        : null;
    }

    return {
      ready: Boolean(preference),
      is13Month,
      phaseKey,
      phaseName: phaseNames[phaseKey] ?? 'New Moon',
      nextPhase,
      harmonic,
      timeline,
      isLoading,
      isFetching,
    };
  }, [is13Month, timeline, moonNow, preference, harmonic, isLoading, isFetching]);
}
