import { useState, useEffect } from 'react';
import SunCalc from 'suncalc';

export type MoonPhaseData = {
  phase: string;
  illumination: number;
  angle: number;
  nextPhase: { name: string; date: Date } | null;
};

export function useMoonPhase(date: Date = new Date()): MoonPhaseData | null {
  const [data, setData] = useState<MoonPhaseData | null>(null);

  useEffect(() => {
    const moon = SunCalc.getMoonIllumination(date);
    const frac = moon.fraction;
    const phaseAngle = moon.phase; // 0 → new → 0.5 full → 1 new

    const getPhaseName = (p: number) => {
      if (p === 0) return 'New Moon';
      if (p > 0 && p < 0.25) return 'Waxing Crescent';
      if (p === 0.25) return 'First Quarter';
      if (p > 0.25 && p < 0.5) return 'Waxing Gibbous';
      if (p === 0.5) return 'Full Moon';
      if (p > 0.5 && p < 0.75) return 'Waning Gibbous';
      if (p === 0.75) return 'Last Quarter';
      return 'Waning Crescent';
    };

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
          const diffDays = Math.abs(target - phaseAngle) * 29.53;
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

