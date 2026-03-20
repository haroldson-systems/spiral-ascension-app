import { harmonicMonths, HarmonicMonth } from './data/harmonicMonths';

export type HarmonicWindow = {
  month: HarmonicMonth;
  startMs: number;
  endMs: number;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MONTH_DAYS = 28;

function getCycleStart(date: Date): Date {
  const year = date.getUTCFullYear();
  const aprilStart = new Date(Date.UTC(year, 3, 1));
  if (date >= aprilStart) return aprilStart;
  return new Date(Date.UTC(year - 1, 3, 1));
}

export function getHarmonicWindow(now: Date = new Date()): HarmonicWindow {
  const cycleStart = getCycleStart(now);
  const dayOffset = Math.floor((now.getTime() - cycleStart.getTime()) / MS_PER_DAY);
  const monthIndex = Math.min(harmonicMonths.length - 1, Math.floor(dayOffset / MONTH_DAYS));
  const month = harmonicMonths[monthIndex] ?? harmonicMonths[0];
  const startMs = cycleStart.getTime() + monthIndex * MONTH_DAYS * MS_PER_DAY;
  const endMs = startMs + MONTH_DAYS * MS_PER_DAY;

  return { month, startMs, endMs };
}

export function getNextHarmonicWindow(now: Date = new Date()): HarmonicWindow {
  const current = getHarmonicWindow(now);
  const currentIndex = harmonicMonths.findIndex((m) => m.month_number === current.month.month_number);
  const nextIndex = (currentIndex + 1) % harmonicMonths.length;
  const startMs = current.endMs;
  const endMs = startMs + MONTH_DAYS * MS_PER_DAY;
  return { month: harmonicMonths[nextIndex], startMs, endMs };
}

export function getHarmonicTimeline(now: Date = new Date()): HarmonicWindow[] {
  const cycleStart = getCycleStart(now);
  return harmonicMonths.map((month, index) => {
    const startMs = cycleStart.getTime() + index * MONTH_DAYS * MS_PER_DAY;
    const endMs = startMs + MONTH_DAYS * MS_PER_DAY;
    return { month, startMs, endMs };
  });
}
