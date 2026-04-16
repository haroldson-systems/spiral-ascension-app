import { supabase } from '@/lib/supabaseClient';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://127.0.0.1:8001/api';
const DEFAULT_FETCH_TIMEOUT_MS = 8000;

function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs: number = DEFAULT_FETCH_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  const { signal: userSignal, ...rest } = init;

  if (userSignal) {
    if (userSignal.aborted) {
      window.clearTimeout(timeoutId);
      controller.abort();
    } else {
      userSignal.addEventListener(
        'abort',
        () => {
          window.clearTimeout(timeoutId);
          controller.abort();
        },
        { once: true },
      );
    }
  }

  return fetch(input, { ...rest, signal: controller.signal }).finally(() => {
    window.clearTimeout(timeoutId);
  });
}

export interface AdminAccessStatus {
  authorized: boolean;
  email: string | null;
  via: string;
}

export function getStoredAdminToken(): string | null {
  try {
    return localStorage.getItem('adminToken');
  } catch {
    return null;
  }
}

export function saveStoredAdminToken(token: string): void {
  try {
    localStorage.setItem('adminToken', token.trim());
  } catch {
    /* ignore storage errors */
  }
}

export function clearStoredAdminToken(): void {
  try {
    localStorage.removeItem('adminToken');
  } catch {
    /* ignore storage errors */
  }
}

export async function buildAdminHeaders(initialHeaders?: HeadersInit): Promise<Headers> {
  const headers = new Headers(initialHeaders ?? {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getStoredAdminToken();
  if (token) {
    headers.set('x-admin-token', token);
  }

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const accessToken = session?.access_token;
    if (accessToken) {
      headers.set('authorization', `Bearer ${accessToken}`);
    }
  } catch {
    /* ignore auth lookup errors and fall back to token-only auth */
  }

  return headers;
}

export async function adminRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = await buildAdminHeaders(options.headers);
  const response = await fetchWithTimeout(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function checkAdminAccess(): Promise<AdminAccessStatus> {
  return adminRequest<AdminAccessStatus>('/admin/access', { method: 'GET' });
}
