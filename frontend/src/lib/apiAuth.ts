import { supabase } from '@/lib/supabaseClient';

/**
 * Resolve the current Supabase access token for authenticated API calls.
 *
 * The backend derives the user identity from this token (verified server-side).
 * Falls back to an anonymous Supabase session so first-time visitors still get a
 * real, verifiable identity instead of a client-chosen ID.
 */
export async function getAccessToken(): Promise<string> {
  try {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.access_token) return data.session.access_token;
  } catch {
    /* try anonymous */
  }
  try {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (!error && data.session?.access_token) return data.session.access_token;
  } catch {
    /* fall through */
  }
  throw new Error('Supabase auth is required');
}

/** Attach `Authorization: Bearer <token>` to a Headers object. */
export async function withAuthHeaders(headers: Headers): Promise<Headers> {
  const token = await getAccessToken();
  headers.set('Authorization', `Bearer ${token}`);
  return headers;
}
