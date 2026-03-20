import { LunarPhase } from './backend';

export type PhaseWindow = {
  phaseKey: string;
  startMs: number;
  endMs: number;
  index: number;
};

export type PhaseTimeline = {
  windows: PhaseWindow[];
  current: PhaseWindow | null;
  next: PhaseWindow | null;
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

export function getPhaseTimeline(
  phases: { phase: typeof LunarPhase.newMoon; startDate: bigint; endDate: bigint }[],
  nowMs: number
): PhaseTimeline {
  const windows: PhaseWindow[] = phases.map((phase, index) => ({
    phaseKey: phaseKey(phase.phase),
    startMs: Number(phase.startDate / BigInt(1_000_000)),
    endMs: Number(phase.endDate / BigInt(1_000_000)),
    index
  }));

  let current: PhaseWindow | null = null;
  let next: PhaseWindow | null = null;

  for (let i = 0; i < windows.length; i += 1) {
    const window = windows[i];
    if (window.startMs <= nowMs && nowMs <= window.endMs) {
      current = window;
      next = windows[i + 1] ?? null;
      break;
    }
  }

  return { windows, current, next };
}

export function getCurrentPhase(
  phases: { phase: typeof LunarPhase.newMoon; startDate: bigint; endDate: bigint }[],
  nowMs: number
): PhaseWindow | null {
  return getPhaseTimeline(phases, nowMs).current;
}

export function getNextPhase(
  phases: { phase: typeof LunarPhase.newMoon; startDate: bigint; endDate: bigint }[],
  nowMs: number
): PhaseWindow | null {
  return getPhaseTimeline(phases, nowMs).next;
}
