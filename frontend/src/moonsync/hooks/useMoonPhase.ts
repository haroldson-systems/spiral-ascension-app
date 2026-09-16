import { useState, useEffect } from 'react';
import SunCalc from 'suncalc';

export type MoonPhaseData = {
  phase: string;
  illumination: number;
  angle: number;
  nextPhase: { name: string; date: Date } | null;
};

/**
 * SunCalc's `phase` is a continuous 0..1 value that is practically never *exactly* 0, 0.25,
 * 0.5 or 0.75, so the four major phases need a tolerance window. Half a day on either side
 * (0.5 day / 29.53 days ≈ 0.017) matches how almanacs label "New/Full/Quarter Moon" for a
 * whole calendar day.
 */
const SYNODIC_DAYS = 29.53;
export const MAJOR_PHASE_TOLERANCE = 0.5 / SYNODIC_DAYS;

export function getPhaseName(p: number, tolerance: number = MAJOR_PHASE_TOLERANCE): string {
  const near = (target: number) => Math.abs(p - target) <= tolerance;
  if (near(0) || near(1)) return 'New Moon';
  if (near(0.25)) return 'First Quarter';
  if (near(0.5)) return 'Full Moon';
  if (near(0.75)) return 'Last Quarter';
  if (p < 0.25) return 'Waxing Crescent';
  if (p < 0.5) return 'Waxing Gibbous';
  if (p < 0.75) return 'Waning Gibbous';
  return 'Waning Crescent';
}

export function useMoonPhase(date: Date = new Date()): MoonPhaseData | null {
  const [data, setData] = useState<MoonPhaseData | null>(null);

  useEffect(() => {
    const moon = SunCalc.getMoonIllumination(date);
    const frac = moon.fraction;
    const phaseAngle = moon.phase; // 0 → new → 0.5 full → 1 new

    const phaseName = getPhaseName(phaseAngle);

    const majorPhases = [
      { name: 'New Moon', target: 0 },
      { name: 'First Quarter', target: 0.25 },
      { name: 'Full Moon', target: 0.5 },
      { name: 'Last Quarter', target: 0.75 },
      { name: 'New Moon', target: 1 }
    ];

    const getClosestNextPhase = () => {
      for (let i = 0; i < majorPhases.length; i += 1) {
        const { name, target } = majorPhases[i];
        if (target > phaseAngle) {
          const diffDays = Math.abs(target - phaseAngle) * SYNODIC_DAYS;
          const nextDate = new Date(date);
          nextDate.setDate(date.getDate() + diffDays);
          return { name, date: nextDate };
        }
      }
      return null;
    };

    const nextPhase = getClosestNextPhase();

    setData({
      phase: phaseName,
      illumination: frac,
      angle: phaseAngle,
      nextPhase
    });
  }, [date]);

  return data;
}

