import { Event, eventTypeKey, eventTypeFromKey, lunarPhaseKey, lunarPhaseFromKey } from './backend';
import { supabase } from '@/lib/supabaseClient';

const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  (import.meta.env.VITE_API_URL_LOCAL as string | undefined) ??
  'http://127.0.0.1:8001/api';
const LOCAL_USER_KEY = 'moonsync-user-id';
const REQUEST_TIMEOUT_MS = 8000;

async function withTimeout<T>(promise: Promise<T>, timeoutMs = REQUEST_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error('Request timed out'));
    }, timeoutMs);

    promise
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timer);
        reject(error);
      });
  });
}

function getStoredUserId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(LOCAL_USER_KEY);
  } catch {
    return null;
  }
}

function storeUserId(userId: string) {
  if (typeof window === 'undefined') return;
  try {
    if (!userId) {
      localStorage.removeItem(LOCAL_USER_KEY);
    } else {
      localStorage.setItem(LOCAL_USER_KEY, userId);
    }
  } catch {
    /* ignore storage errors */
  }
}

async function getUserId(): Promise<string> {
  try {
    const { data: userData } = await withTimeout(supabase.auth.getUser());
    if (userData?.user?.id) {
      storeUserId(userData.user.id);
      return userData.user.id;
    }
  } catch {
    /* ignore and try anonymous */
  }

  try {
    const { data, error } = await withTimeout(supabase.auth.signInAnonymously());
    if (!error && data.user?.id) {
      storeUserId(data.user.id);
      return data.user.id;
    }
  } catch {
    /* ignore and surface error below */
  }

  const stored = getStoredUserId();
  if (stored) {
    // Stored IDs are only valid if auth exists; clear to avoid FK issues.
    storeUserId('');
  }
  throw new Error('Supabase anonymous auth is required for MoonSync');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const userId = await getUserId();
  headers.set('x-moonsync-user', userId);

  const response = await withTimeout(
    fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    }),
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchCyclePreference(): Promise<'12' | '13'> {
  const data = await request<{ cycleMode: number }>('/moonsync/settings');
  return data.cycleMode === 13 ? '13' : '12';
}

export async function updateCyclePreference(value: '12' | '13'): Promise<void> {
  await request('/moonsync/settings', {
    method: 'POST',
    body: JSON.stringify({ cycleMode: value === '13' ? 13 : 12 }),
  });
}

export async function fetchEvents(): Promise<Event[]> {
  const data = await request<
    {
      id: string;
      title: string;
      description: string;
      eventType: string;
      associatedPhase: string;
      eventAt: string;
    }[]
  >('/moonsync/events');

  return data.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description ?? '',
    eventType: eventTypeFromKey(item.eventType),
    associatedPhase: lunarPhaseFromKey(item.associatedPhase),
    date: BigInt(Date.parse(item.eventAt)) * BigInt(1_000_000),
  }));
}

export async function fetchLunarPhases(year: number) {
  return request<
    {
      phase: string;
      startAtMs: number;
      endAtMs: number;
    }[]
  >(`/moonsync/phases?year=${encodeURIComponent(year)}`);
}

export async function createEvent(event: Event): Promise<void> {
  await request('/moonsync/events', {
    method: 'POST',
    body: JSON.stringify({
      id: event.id,
      title: event.title,
      description: event.description ?? '',
      eventType: eventTypeKey(event.eventType),
      associatedPhase: lunarPhaseKey(event.associatedPhase),
      eventAt: new Date(Number(event.date / BigInt(1_000_000))).toISOString(),
    }),
  });
}

export async function updateEvent(event: Event): Promise<void> {
  await request(`/moonsync/events/${encodeURIComponent(event.id)}`, {
    method: 'PUT',
    body: JSON.stringify({
      title: event.title,
      description: event.description ?? '',
      eventType: eventTypeKey(event.eventType),
      associatedPhase: lunarPhaseKey(event.associatedPhase),
      eventAt: new Date(Number(event.date / BigInt(1_000_000))).toISOString(),
    }),
  });
}

export async function removeEvent(eventId: string): Promise<void> {
  await request(`/moonsync/events/${encodeURIComponent(eventId)}`, {
    method: 'DELETE',
  });
}
