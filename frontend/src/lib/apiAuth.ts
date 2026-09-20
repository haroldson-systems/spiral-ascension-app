import { supabase } from '@/lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';

/**
 * Resolve the current Supabase session for authenticated API calls.
 *
 * The backend derives the user identity from the access token (verified
 * server-side). Falls back to an anonymous Supabase session so first-time
 * visitors still get a real, verifiable identity instead of a client-chosen ID.
 */
export async function getAuthSession(): Promise<Session> {
  try {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.access_token) return data.session;
  } catch {
    /* try anonymous */
  }
  try {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (!error && data.session?.access_token) return data.session;
  } catch {
    /* fall through */
  }
  throw new Error('Supabase auth is required');
}

export async function getAccessToken(): Promise<string> {
  return (await getAuthSession()).access_token;
}

/**
 * Attach auth headers to a Headers object.
 *
 * - `Authorization: Bearer <token>` is what the current backend verifies.
 * - `x-moonsync-user: <user id>` is a TRANSITIONAL compatibility header: a
 *   backend that still runs the pre-JWT code (e.g. Render on `main` while a
 *   frontend preview already ships this branch) rejects requests without it
 *   with 400 "Missing x-moonsync-user header". The JWT-verifying backend never
 *   trusts this header for scoping; it only rejects a value that disagrees
 *   with the verified token. Remove once the JWT backend is deployed everywhere.
 */
export async function withAuthHeaders(headers: Headers): Promise<Headers> {
  const session = await getAuthSession();
  headers.set('Authorization', `Bearer ${session.access_token}`);
  if (session.user?.id) headers.set('x-moonsync-user', session.user.id);
  return headers;
}

/** Turn a failed API response into a readable message (FastAPI `{detail}` aware). */
export async function apiErrorMessage(res: Response): Promise<string> {
  let text = '';
  try {
    text = await res.text();
  } catch {
    /* unreadable body */
  }
  if (text) {
    try {
      const parsed = JSON.parse(text) as { detail?: unknown; message?: unknown };
      const detail = parsed?.detail ?? parsed?.message;
      if (typeof detail === 'string' && detail.trim()) return `${detail} (HTTP ${res.status})`;
      if (detail !== undefined) return `${JSON.stringify(detail)} (HTTP ${res.status})`;
    } catch {
      /* not JSON */
    }
    return `${text.slice(0, 300)} (HTTP ${res.status})`;
  }
  return `${res.statusText || 'Request failed'} (HTTP ${res.status})`;
}
