const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://127.0.0.1:8001/api';

function getAdminToken(): string | null {
  try {
    return localStorage.getItem('adminToken');
  } catch {
    return null;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAdminToken();
  if (token) {
    headers.set('x-admin-token', token);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export interface SiteSettings {
  maintenanceMode: boolean;
}

export async function fetchSiteSettings(): Promise<SiteSettings> {
  return request<SiteSettings>('/site-settings');
}

export async function updateSiteSettings(payload: SiteSettings): Promise<SiteSettings> {
  return request<SiteSettings>('/site-settings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
