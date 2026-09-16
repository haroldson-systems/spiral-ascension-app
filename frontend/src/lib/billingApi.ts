import { supabase } from '@/lib/supabaseClient';
import { getAccessToken } from '@/lib/apiAuth';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://127.0.0.1:8001/api';

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

export interface CheckoutSessionPayload {
  email: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CheckoutSessionResponse {
  url: string;
  sessionId: string;
}

export interface CheckoutSessionSummary {
  sessionId: string;
  status?: string | null;
  paymentStatus?: string | null;
  customerEmail?: string | null;
  customerId?: string | null;
  subscriptionId?: string | null;
}

export interface PortalSessionPayload {
  checkoutSessionId: string;
  returnUrl?: string;
}

export interface PortalSessionResponse {
  url: string;
}

export async function createCheckoutSession(
  payload: CheckoutSessionPayload
): Promise<CheckoutSessionResponse> {
  // If the buyer is signed in, pass the session so the subscription is bound to their user id
  // (durable ownership for billing portal / account deletion). Guests still check out normally.
  const headers = new Headers();
  try {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.access_token) headers.set('Authorization', `Bearer ${data.session.access_token}`);
  } catch {
    /* guest checkout */
  }
  return request<CheckoutSessionResponse>('/billing/checkout-session', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
}

export async function fetchCheckoutSession(
  sessionId: string
): Promise<CheckoutSessionSummary> {
  return request<CheckoutSessionSummary>(`/billing/checkout-session/${encodeURIComponent(sessionId)}`);
}

export async function createPortalSession(
  payload: PortalSessionPayload
): Promise<PortalSessionResponse> {
  return request<PortalSessionResponse>('/billing/portal-session', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// --- Signed-in billing (authorization = Supabase session, customer = stored Stripe id) ---

export interface BillingStatus {
  hasCustomer: boolean;
  status: string | null;
  cancelAtPeriodEnd: boolean;
  trialEnd: string | null;
  currentPeriodEnd: string | null;
  paymentFailed: boolean;
  needsLinking: boolean;
}

async function authedRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  const headers = new Headers(options.headers ?? {});
  headers.set('Authorization', `Bearer ${token}`);
  return request<T>(path, { ...options, headers });
}

export async function fetchBillingStatus(): Promise<BillingStatus> {
  return authedRequest<BillingStatus>('/billing/status');
}

/** Open the Stripe customer portal for the signed-in user (manage / cancel / update card). */
export async function createAccountPortalSession(returnUrl?: string): Promise<PortalSessionResponse> {
  return authedRequest<PortalSessionResponse>('/billing/portal', {
    method: 'POST',
    body: JSON.stringify({ returnUrl }),
  });
}
