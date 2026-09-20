-- Stripe webhook idempotency log. Run once in the Supabase SQL Editor (service role only; no RLS policies
-- for clients). The backend inserts one row per Stripe event id and skips events it has already seen.
-- Until this table exists the webhook still works, just without deduplication (a warning is logged once).

CREATE TABLE IF NOT EXISTS public.billing_webhook_events (
    event_id text PRIMARY KEY,
    event_type text NOT NULL,
    received_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.billing_webhook_events ENABLE ROW LEVEL SECURITY;

-- Optional housekeeping: Stripe retries for up to 3 days, so rows older than 30 days can be pruned.
-- DELETE FROM public.billing_webhook_events WHERE received_at < now() - interval '30 days';
