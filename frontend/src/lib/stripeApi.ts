const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://127.0.0.1:8001/api';

const DEFAULT_FETCH_TIMEOUT_MS = 25_000;

function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs: number = DEFAULT_FETCH_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const { signal: userSignal, ...rest } = init;

  if (userSignal) {
    if (userSignal.aborted) {
      clearTimeout(timeoutId);
      controller.abort();
    } else {
      userSignal.addEventListener(
        'abort',
        () => {
          clearTimeout(timeoutId);
          controller.abort();
        },
        { once: true }
      );
    }
  }

  return fetch(input, { ...rest, signal: controller.signal }).finally(() =>
    clearTimeout(timeoutId)
  );
}

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

export interface CreateCheckoutSessionInput {
  email?: string;
}

export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

export async function createCheckoutSession(
  input: CreateCheckoutSessionInput = {}
): Promise<CheckoutSessionResponse> {
  const body: Record<string, string> = {
    successUrl: `${window.location.origin}/checkout/success`,
    cancelUrl: `${window.location.origin}/checkout/cancel`,
  };
  const trimmed = input.email?.trim();
  if (trimmed) {
    body.email = trimmed;
  }
  return request<CheckoutSessionResponse>('/stripe/checkout-session', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
