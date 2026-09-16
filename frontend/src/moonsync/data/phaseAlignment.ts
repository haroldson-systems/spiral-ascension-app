/** 12-month mode: "Best for / Not ideal for" per lunar phase (keyed by phase key). */
export type PhaseAlignment = {
  bestFor: string;
  notIdealFor: string;
};

export const phaseAlignment: Record<string, PhaseAlignment> = {
  newMoon: {
    bestFor: 'setting intentions, new beginnings, planting seeds',
    notIdealFor: 'closing loops, heavy release work',
  },
  waxingCrescent: {
    bestFor: 'building momentum, early action, gathering resources',
    notIdealFor: 'completion work, deep reflection',
  },
  firstQuarter: {
    bestFor: 'decision-making, pushing through resistance, taking action',
    notIdealFor: 'rest, waiting',
  },
  waxingGibbous: {
    bestFor: 'refining, adjusting, commitment',
    notIdealFor: 'starting from scratch',
  },
  fullMoon: {
    bestFor: 'culmination, celebration, visibility, completion',
    notIdealFor: 'quiet reflection, low-energy work',
  },
  waningGibbous: {
    bestFor: 'release, completion, gratitude, closing loops',
    notIdealFor: 'new launches, initiation, pushing hard',
  },
  lastQuarter: {
    bestFor: 'letting go, evaluation, clearing space',
    notIdealFor: 'new commitments, starting projects',
  },
  waningCrescent: {
    bestFor: 'rest, integration, deep reflection',
    notIdealFor: 'new commitments, external action',
  },
};

export const fallbackAlignment: PhaseAlignment = {
  bestFor: 'reflection and phase-aware planning',
  notIdealFor: 'forcing action without clarity',
};

/** Phases whose arc builds outward → "Amplify momentum"; the rest → "Dissolve resistance". */
export const amplifyPhases = new Set(['newMoon', 'waxingCrescent', 'firstQuarter', 'waxingGibbous', 'fullMoon']);
