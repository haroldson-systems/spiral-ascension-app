import { withAuthHeaders } from '@/lib/apiAuth';

const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://127.0.0.1:8001/api';

async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = await withAuthHeaders(new Headers(init.headers ?? {}));
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  return fetch(`${API_BASE}${path}`, { ...init, headers });
}

async function errorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as { detail?: unknown };
    if (typeof body?.detail === 'string') return body.detail;
  } catch {
    /* not JSON */
  }
  return fallback;
}

/** Download everything stored for the signed-in user as a JSON file. */
export async function downloadAccountExport(): Promise<void> {
  const res = await authedFetch('/account/export');
  if (!res.ok) throw new Error(await errorMessage(res, `Export failed (${res.status})`));

  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition') ?? '';
  const match = /filename="?([^"]+)"?/.exec(disposition);
  const filename = match?.[1] ?? 'spiral-ascension-export.json';

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export interface AccountDeleteResult {
  deleted: boolean;
  removed: Record<string, number>;
  subscriptionsCancelled: number;
  billingRecordsAnonymized: number;
}

/** Permanently delete the signed-in account. `confirmation` must be the literal "DELETE". */
export async function deleteAccount(confirmation: string): Promise<AccountDeleteResult> {
  const res = await authedFetch('/account', {
    method: 'DELETE',
    body: JSON.stringify({ confirmation }),
  });
  if (!res.ok) throw new Error(await errorMessage(res, `Deletion failed (${res.status})`));
  return (await res.json()) as AccountDeleteResult;
}
