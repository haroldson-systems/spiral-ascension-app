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
  return request<CheckoutSessionResponse>('/billing/checkout-session', {
    method: 'POST',
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
