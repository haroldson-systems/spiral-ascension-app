/**
 * Types matching the Motoko backend (backend/main.mo).
 * Used by the MoonSync tracker for actor calls and UI.
 */

export const CycleType = {
  twelveMonth: { twelveMonth: null } as const,
  thirteenMonth: { thirteenMonth: null } as const,
} as const;
export type CycleType = (typeof CycleType)[keyof typeof CycleType];

export const LunarPhase = {
  newMoon: { newMoon: null } as const,
  waxingCrescent: { waxingCrescent: null } as const,
  firstQuarter: { firstQuarter: null } as const,
  waxingGibbous: { waxingGibbous: null } as const,
  fullMoon: { fullMoon: null } as const,
  waningGibbous: { waningGibbous: null } as const,
  lastQuarter: { lastQuarter: null } as const,
  waningCrescent: { waningCrescent: null } as const,
} as const;
export type LunarPhase = (typeof LunarPhase)[keyof typeof LunarPhase];

export const EventType = {
  ritual: { ritual: null } as const,
  reminder: { reminder: null } as const,
  milestone: { milestone: null } as const,
} as const;
export type EventType = (typeof EventType)[keyof typeof EventType];

export interface Event {
  id: string;
  title: string;
  description: string;
  eventType: EventType;
  date: bigint;
  associatedPhase: LunarPhase;
}

export interface LunarPhaseInfo {
  phase: LunarPhase;
  startDate: bigint;
  endDate: bigint;
}

export interface UserPreference {
  cycleType: CycleType;
}

export function isThirteenMonth(c: CycleType): boolean {
  return 'thirteenMonth' in c;
}

export interface BackendActor {
  getCyclePreference: (user: { _principal: unknown }) => Promise<UserPreference | undefined>;
  setCyclePreference: (cycleType: CycleType) => Promise<void>;
  getLunarPhases: (cycleType: CycleType, year: bigint) => Promise<LunarPhaseInfo[]>;
  getEvents: (user: { _principal: unknown }) => Promise<Event[]>;
  addEvent: (event: Event) => Promise<void>;
  updateEvent: (event: Event) => Promise<void>;
  removeEvent: (eventId: string) => Promise<void>;
  recalculateEvents: () => Promise<void>;
}
