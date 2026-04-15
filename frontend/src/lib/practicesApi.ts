import type { Practice, PracticeVariant } from '@/data/practices';
import { adminRequest } from '@/lib/adminApi';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
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

export async function fetchPractices(): Promise<Practice[]> {
  return request<Practice[]>('/practices');
}

export async function fetchPracticeVariants(parentId?: string): Promise<PracticeVariant[]> {
  const query = parentId ? `?parentId=${encodeURIComponent(parentId)}` : '';
  return request<PracticeVariant[]>(`/practice-variants${query}`);
}

export async function upsertPractice(practice: Practice): Promise<Practice> {
  return adminRequest<Practice>('/practices', {
    method: 'POST',
    body: JSON.stringify(practice),
  });
}

export async function upsertPracticeVariant(variant: PracticeVariant): Promise<PracticeVariant> {
  return adminRequest<PracticeVariant>('/practice-variants', {
    method: 'POST',
    body: JSON.stringify(variant),
  });
}

export async function deletePractice(practiceId: string): Promise<void> {
  await adminRequest(`/practices/${encodeURIComponent(practiceId)}`, { method: 'DELETE' });
}

export async function deletePracticeVariant(variantId: string): Promise<void> {
  await adminRequest(`/practice-variants/${encodeURIComponent(variantId)}`, { method: 'DELETE' });
}

export async function bulkUpsertPractices(practices: Practice[]): Promise<Practice[]> {
  return adminRequest<Practice[]>('/practices/bulk', {
    method: 'POST',
    body: JSON.stringify(practices),
  });
}

export async function bulkUpsertPracticeVariants(variants: PracticeVariant[]): Promise<PracticeVariant[]> {
  return adminRequest<PracticeVariant[]>('/practice-variants/bulk', {
    method: 'POST',
    body: JSON.stringify(variants),
  });
}
