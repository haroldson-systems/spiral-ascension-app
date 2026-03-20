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

export type EventTypeKey = 'ritual' | 'reminder' | 'milestone';
export type LunarPhaseKey =
  | 'newMoon'
  | 'waxingCrescent'
  | 'firstQuarter'
  | 'waxingGibbous'
  | 'fullMoon'
  | 'waningGibbous'
  | 'lastQuarter'
  | 'waningCrescent';

export function eventTypeKey(eventType: EventType): EventTypeKey {
  if ('ritual' in eventType) return 'ritual';
  if ('reminder' in eventType) return 'reminder';
  return 'milestone';
}

export function eventTypeFromKey(key: string): EventType {
  if (key === 'ritual') return EventType.ritual;
  if (key === 'reminder') return EventType.reminder;
  return EventType.milestone;
}

export function lunarPhaseKey(phase: LunarPhase): LunarPhaseKey {
  if ('newMoon' in phase) return 'newMoon';
  if ('waxingCrescent' in phase) return 'waxingCrescent';
  if ('firstQuarter' in phase) return 'firstQuarter';
  if ('waxingGibbous' in phase) return 'waxingGibbous';
  if ('fullMoon' in phase) return 'fullMoon';
  if ('waningGibbous' in phase) return 'waningGibbous';
  if ('lastQuarter' in phase) return 'lastQuarter';
  return 'waningCrescent';
}

export function lunarPhaseFromKey(key: string): LunarPhase {
  switch (key) {
    case 'newMoon':
      return LunarPhase.newMoon;
    case 'waxingCrescent':
      return LunarPhase.waxingCrescent;
    case 'firstQuarter':
      return LunarPhase.firstQuarter;
    case 'waxingGibbous':
      return LunarPhase.waxingGibbous;
    case 'fullMoon':
      return LunarPhase.fullMoon;
    case 'waningGibbous':
      return LunarPhase.waningGibbous;
    case 'lastQuarter':
      return LunarPhase.lastQuarter;
    default:
      return LunarPhase.waningCrescent;
  }
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
