import { supabase } from '@/lib/supabaseClient';

const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  'http://127.0.0.1:8001/api';

async function getUserId(): Promise<string> {
  try {
    const { data } = await supabase.auth.getUser();
    if (data?.user?.id) return data.user.id;
  } catch {
    /* try anonymous */
  }
  try {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (!error && data.user?.id) return data.user.id;
  } catch {
    /* fall through */
  }
  throw new Error('Supabase auth is required for the Vault');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const userId = await getUserId();
  headers.set('x-moonsync-user', userId);

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) throw new Error(await res.text() || `Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

// --- Spiral Notes ---
export async function fetchSpiralNote(moduleId: string): Promise<{ content: string }> {
  return request<{ content: string }>(`/vault/spiral-notes/${encodeURIComponent(moduleId)}`);
}

export async function saveSpiralNoteToApi(moduleId: string, content: string): Promise<void> {
  await request(`/vault/spiral-notes/${encodeURIComponent(moduleId)}`, {
    method: 'PUT',
    body: JSON.stringify({ content }),
  });
}

// --- Personal Writings ---
export interface VaultEntryApi {
  id: string;
  content: string;
  tags: string[];
  type: string;
  created_at: string;
}

export async function fetchVaultEntries(): Promise<VaultEntryApi[]> {
  return request<VaultEntryApi[]>('/vault/entries');
}

export async function createVaultEntry(payload: {
  content: string;
  tags: string[];
  type: string;
}): Promise<VaultEntryApi> {
  return request<VaultEntryApi>('/vault/entries', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
