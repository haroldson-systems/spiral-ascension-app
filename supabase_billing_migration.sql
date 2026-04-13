-- Backend uses Supabase service role; RLS is bypassed. This table holds
-- server-managed Stripe subscription snapshots for webhooks and billing state.

CREATE TABLE IF NOT EXISTS public.billing_subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_subscription_id text UNIQUE,
    stripe_customer_id text,
    customer_email text,
    stripe_price_id text,
    stripe_product_id text,
    status text NOT NULL DEFAULT 'incomplete',
    cancel_at_period_end boolean NOT NULL DEFAULT false,
    trial_end timestamptz,
    current_period_end timestamptz,
    checkout_session_id text,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS billing_subscriptions_customer_email_idx
    ON public.billing_subscriptions (customer_email);

CREATE INDEX IF NOT EXISTS billing_subscriptions_stripe_customer_id_idx
    ON public.billing_subscriptions (stripe_customer_id);

-- Backend service role (and other privileged roles) bypass RLS; webhooks use service role.

ALTER TABLE public.billing_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "billing_subscriptions_select_own_by_jwt_email"
    ON public.billing_subscriptions
    FOR SELECT
    TO authenticated
    USING (
        customer_email IS NOT NULL
        AND customer_email = (auth.jwt() ->> 'email')
    );
